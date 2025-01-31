import { Collection, ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import { APIPhone, APITime, contactModel } from "./types.ts"; //Vehicle, VehicleModel, Parts, PartsModel

    type Context = {
        contactCollection: Collection<contactModel>;
    }

    export const resolvers = {
        Contact: {
            id: (parent: contactModel) => parent._id!.toString(),
            hora: async (parent: contactModel): Promise<string> => {
                const API_KEY = Deno.env.get("API_KEY");
                if (!API_KEY) throw new Error("No API key provided")
                const url = "https://api.api-ninjas.com/v1/worldtime?timezone=" + parent.timezone
                const data = await fetch(url, {
                    headers: {
                        'X-Api-Key': API_KEY
                    },
                });
                if (data.status !== 200) throw new GraphQLError("Error al llamar a la API de la hora")
                const response: APITime = await data.json()
                return response.datetime

            }
        },
        Query: {
            getContact: async (_: unknown, args: { id: string }, ctx: Context): Promise<contactModel | null> => {
                return await ctx.contactCollection.findOne({ _id: new ObjectId(args.id) })
            },
            getContacts: async (_: unknown, __: unknown, ctx: Context): Promise<contactModel[]> => {
                return await ctx.contactCollection.find().toArray()
            }

        },
        Mutation: {
            addContact: async (_: unknown, args: { nombre: string, telefono: string }, ctx: Context): Promise<contactModel> => {
                //1ra validación, sólo un usuario existe
                const userExists = await ctx.contactCollection.findOne({ telefono: args.telefono })
                if (userExists) throw new GraphQLError("Ya hay un usuario registrado con ese teléfono")
                //2da validación el teléfono es correcto
                const API_KEY = Deno.env.get("API_KEY");
                if (!API_KEY) throw new Error("No API key provided")
                const url = "https://api.api-ninjas.com/v1/validatephone?number=" + args.telefono
                const data = await fetch(url, {
                    headers: {
                        'X-Api-Key': API_KEY
                    },
                });

                if (data.status !== 200) throw new GraphQLError("Error al llamar a la API de validación")
                const response: APIPhone = await data.json()
                if (!response.is_valid) throw new GraphQLError("El telefono introducido es erróneo")
                //Pasamos todas las validaciones asi que guardamos
                const { insertedId } = await ctx.contactCollection.insertOne({
                    nombre: args.nombre,
                    telefono: args.telefono,
                    pais: response.country,
                    timezone: response.timezones[0],
                })
                return {
                    _id : insertedId!.toString(),
                    nombre: args.nombre,
                    telefono: args.telefono,
                    pais: response.country,
                    timezone: response.timezones[0],
                }

            },

            deleteContact: async (_: unknown, args: { id: string }, ctx: Context): Promise<Boolean> => {
                const { deletedCount } = await ctx.contactCollection.deleteOne({ _id: new ObjectId(args.id) })
                return deletedCount === 1;
            },
            updateContact: async (
              _: unknown,
              args: { id: string; nombre: string; telefono: string }, ctx: Context
            ): Promise<contactModel> => {
              try {
                const contact = await ctx.contactCollection.findOne({_id: new ObjectId(args.id) });
                if (!contact) {
                  throw new GraphQLError("Contact not found");
                }
          
                if (args.telefono && args.telefono !== contact.telefono) {
                  const API_KEY = Deno.env.get("API_KEY");
                  if (!API_KEY) throw new Error("No API key provided")
                  const url = "https://api.api-ninjas.com/v1/validatephone?number=" + args.telefono
                  const data = await fetch(url, {
                      headers: {
                          'X-Api-Key': API_KEY
                      },
                  });
                  const response: APIPhone = await data.json()
                  if (!response.is_valid) throw new GraphQLError("El telefono introducido es erróneo");
                  const countryInfo = response.country;
                  contact.telefono = args.telefono;
                  contact.pais = countryInfo;
                }
          
                if (args.nombre) {
                  contact.nombre = args.nombre;
                }
          
                await ctx.contactCollection.updateOne({_id: new ObjectId(args.id) },{
                    nombre: args.nombre,
                    telefono: args.telefono,
                    pais: contact.pais,
                    //timezone: response.timezones[0],
                });
          
                return contact;
              } catch (err) {
                console.log(err);
                throw new GraphQLError("Error al actualizar el contacto");
              }
            },
        }
    }
