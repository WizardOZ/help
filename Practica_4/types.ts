import { OptionalId,ObjectId } from "mongodb";


export type contactModel= {
  nombre:  string,
  telefono: string,
  pais: string,
  timezone: string,
}

export type APIPhone = {
    is_valid: string,
    country: string,
    timezones: string,
}

export type APITime = {
    datetime : string
}