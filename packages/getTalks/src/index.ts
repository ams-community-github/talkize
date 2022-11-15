import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { unflatten } from 'flat';
import { Talk } from './types/talk';

let client: DynamoDBDocumentClient;

export const handler: APIGatewayProxyHandler = async () => {
  if (!client) {
    client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_DEFAULT_REGION,
        endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
      }),
    );
  }

  const { Items } = await client.send(
    new QueryCommand({
      TableName: process.env.TALK_TABLE_NAME,
      ExpressionAttributeValues: {
        ':partitionKey': 'talks',
      },
      KeyConditionExpression: 'partitionKey = :partitionKey',
      ConsistentRead: false,
    }),
  );

  const talks = Items?.map((i) => {
    const { partitionKey, sortKey, ...flattenData } = i;
    const talkWithoutId = unflatten(flattenData) as Talk;
    return {
      ...talkWithoutId,
      id: sortKey.split('|')[1],
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify(talks),
  };
};
