import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';
import { flatten } from 'flat';
import { isLeft } from 'fp-ts/lib/Either';
import * as uuid from 'uuid';
import { talkDecoder } from './decoder';
import { Talk } from './types/talk';

let client: DynamoDBDocumentClient;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const contentType = getContentType(event.headers);

  if (!isValidContentType(contentType)) {
    throw new Error(`Invalid content-type: ${contentType}`);
  }

  const payload = JSON.parse(event.body || '{}');

  const result = talkDecoder.decode(payload);

  if (isLeft(result)) {
    return {
      statusCode: 400,
      body: 'Invalid payload',
    };
  }

  if (!client) {
    client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_DEFAULT_REGION,
        endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
      }),
      {
        marshallOptions: {
          convertEmptyValues: true,
          removeUndefinedValues: true,
        },
      },
    );
  }

  const talk: Talk = {
    ...result.right,
    status: 'submitted',
  };

  const talkId = uuid.v4();

  await client.send(
    new PutCommand({
      TableName: process.env.TALK_TABLE_NAME,
      Item: {
        partitionKey: `talks`,
        sortKey: `${new Date().toISOString()}|${talkId}`,
        ...flatten(talk),
      },
    }),
  );

  return {
    statusCode: 200,
    body: 'Talk created!',
  };
};

const getContentType = (headers: APIGatewayProxyEventHeaders) =>
  headers[
    Object.keys(headers).find(
      (key) => key.toLocaleLowerCase() === 'content-type',
    ) || ''
  ] || '';

const isValidContentType = (value: string): value is 'application/json' =>
  value.includes('application/json');
