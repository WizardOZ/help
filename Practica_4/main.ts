import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { MongoClient } from "mongodb";
import { schema } from "./schema.ts";
import { resolvers } from "./resolvers.ts";
import {contactModel} from "./types.ts"; // testModel

//const MONGO_URL = "mongodb+srv://jero:password.@cluster0.u7aqpfe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//const API_KEY = "OM5JKKx8hBVW2MdbRefj1A==yLbGfkLL4rZtWDaQ";
const MONGO_URL = Deno.env.get("MONGO_URL");
const API_KEY = Deno.env.get("API_KEY");

if (!MONGO_URL) {
  throw new Error("Please provide a MONGO_URL");
}
if (!API_KEY) {
  throw new Error("Please provide a correct API_KEY");
}
// Conexión con MongoDB
const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();
console.info("Connected to MongoDB");

const mongoDB = mongoClient.db("test");

// Colecciones de MongoDB
//const VehiclesCollection = mongoDB.collection<VehicleModel>("vehiculos");
const contactCollection = mongoDB.collection<contactModel>("contactModel");

// Configuración del servidor Apollo
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async () => ({ contactCollection}), listen: {port : 5000}
    
});


console.info(`🚀 Server ready at ${url}`);