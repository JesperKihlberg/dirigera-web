import { gql } from "graphql-tag";
import type { Scene } from "dirigera";
import type { Resolvers } from "../resolvers.gen.ts";

export const typeDefs = gql`
  type Scene {
    id: String!
    name: String!
  }

  extend type Query {
    scenes: [Scene!]! @loggedIn
  }

  extend type Mutation {
    activateScene(id: String!): String @loggedIn
  }
`;

export function getUserScenes(scenes: Scene[]) {
  return scenes
    .filter((scene) => scene.type === "userScene")
    .map((scene) => ({
      id: scene.id,
      name: scene.info.name,
    }));
}

export const resolvers: Resolvers = {
  Query: {
    scenes: async (_, __, { homeState: { scenes } }) => {
      return getUserScenes(scenes);
    },
  },
  Mutation: {
    activateScene: async (_, { id }, { dirigeraClient }) => {
      await dirigeraClient.scenes.trigger({ id });
      return null;
    },
  },
};
