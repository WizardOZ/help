export const schema = `#graphql

type Contact{
  id: ID!
  nombre: String!
  telefono: String!
  pais: String!
  hora: String!
}

type Query {
  getContact(id: ID!): Contact
  getContacts: [Contact!]!
}

type Mutation{
  addContact(nombre: String!, telefono: String!): Contact!
  deleteContact(id: ID!): Boolean
  updateContact(id: ID!, nombre: String, telefono: String): Contact!

}

`;