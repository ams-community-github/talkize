import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { unflatten } from 'flat';

let client: DynamoDBDocumentClient;

export const handler: APIGatewayProxyHandlerV2 = async () => {
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

  return {
    statusCode: 200,
    body: JSON.stringify(unflatten(Items || [])),
  };
};
