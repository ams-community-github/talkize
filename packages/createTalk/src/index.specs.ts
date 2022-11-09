import faker from 'faker';
import { handler } from './index';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { Factory } from 'rosie';
import { Talk } from './types/talk';

const dynamoDBMock = mockClient(DynamoDBDocumentClient);

describe('ChangeCancelledEndpoint', () => {
  beforeEach(() => {
    process.env.TALK_TABLE_NAME = faker.datatype.string();
  });

  afterEach(() => {
    delete process.env.TALK_TABLE_NAME;
    dynamoDBMock.reset();
  });

  it(`
    Given a talk
    When submitting a talk
    Then the talk is submitted
  `, async () => {
    const talk = talkFactory().build();

    const headers = {
      'Content-Type': 'application/json',
    };

    const expectedResponse = {
      statusCode: 200,
      body: 'Talk created!',
    };

    const expectedPutCommand = {
      TableName: process.env.TALK_TABLE_NAME,
      Item: {
        abstract: talk.abstract,
        category: talk.category,
        format: talk.format,
        partitionKey: 'talks',
        sortKey: expect.any(String),
        'speaker.email': talk.speaker.email,
        'speaker.firstName': talk.speaker.firstName,
        'speaker.lastName': talk.speaker.lastName,
        status: 'submitted',
        title: talk.title,
      },
    };

    const actualResponse = (await handler(
      {
        body: JSON.stringify(talk),
        headers,
      } as any,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResultV2;

    const actualPutCommand = dynamoDBMock
      .commandCalls(PutCommand)
      .map((call) => call.args[0].input);

    expect(actualResponse).toEqual(expectedResponse);
    expect(actualPutCommand).toEqual(
      expect.arrayContaining([expectedPutCommand]),
    );
  });

  it(`
    Given an invalid talk without an abstract
    When a talk is submited
    Then an Invalid payload error is returned
  `, async () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const expected = {
      statusCode: 400,
      body: 'Invalid payload',
    };

    const talk = talkFactory().build({
      abstract: undefined,
    });

    const actual = (await handler(
      {
        body: JSON.stringify(talk),
        headers,
      } as any,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResultV2;

    expect(actual).toEqual(expected);
  });

  it(`
    Given an invalid talk with an invalid category
    When a talk is submited
    Then an Invalid payload error is returned
  `, async () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const expected = {
      statusCode: 400,
      body: 'Invalid payload',
    };

    const talk = talkFactory().build({
      category: faker.datatype.uuid() as any,
    });

    const actual = (await handler(
      {
        body: JSON.stringify(talk),
        headers,
      } as any,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResultV2;

    expect(actual).toEqual(expected);
  });

  it(`
    Given an invalid talk with an invalid format
    When a talk is submited
    Then an Invalid payload error is returned
  `, async () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const expected = {
      statusCode: 400,
      body: 'Invalid payload',
    };

    const talk = talkFactory().build({
      format: faker.datatype.uuid() as any,
    });

    const actual = (await handler(
      {
        body: JSON.stringify(talk),
        headers,
      } as any,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResultV2;

    expect(actual).toEqual(expected);
  });

  it(`
    Given an invalid talk without a speaker first name
    When a talk is submited
    Then an Invalid payload error is returned
  `, async () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const expected = {
      statusCode: 400,
      body: 'Invalid payload',
    };

    const talk = talkFactory().build({
      speaker: {
        firstName: undefined,
        lastName: faker.datatype.string(),
        email: faker.internet.email(),
      } as any,
    });

    const actual = (await handler(
      {
        body: JSON.stringify(talk),
        headers,
      } as any,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResultV2;

    expect(actual).toEqual(expected);
  });

  it(`
    Given an invalid talk without a speaker last name
    When a talk is submited
    Then an Invalid payload error is returned
  `, async () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const expected = {
      statusCode: 400,
      body: 'Invalid payload',
    };

    const talk = talkFactory().build({
      speaker: {
        firstName: faker.datatype.string(),
        lastName: undefined,
        email: faker.internet.email(),
      } as any,
    });

    const actual = (await handler(
      {
        body: JSON.stringify(talk),
        headers,
      } as any,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResultV2;

    expect(actual).toEqual(expected);
  });

  it(`
    Given an invalid talk without a speaker email
    When a talk is submited
    Then an Invalid payload error is returned
  `, async () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const expected = {
      statusCode: 400,
      body: 'Invalid payload',
    };

    const talk = talkFactory().build({
      speaker: {
        firstName: faker.datatype.string(),
        lastName: faker.datatype.string(),
        email: undefined,
      } as any,
    });

    const actual = (await handler(
      {
        body: JSON.stringify(talk),
        headers,
      } as any,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResultV2;

    expect(actual).toEqual(expected);
  });
});

const talkFactory = () => {
  return new Factory<Omit<Talk, 'status'>>()
    .attr('abstract', faker.lorem.paragraph())
    .attr(
      'category',
      faker.random.arrayElement([
        'languages',
        'agile',
        'web',
        'data',
        'mobile',
        'cloud',
        'architecture',
      ]),
    )
    .attr(
      'format',
      faker.random.arrayElement(['conference', 'workshop', 'quickies']),
    )
    .attr('speaker', {
      firstName: faker.datatype.string(),
      lastName: faker.datatype.string(),
      email: faker.internet.email(),
    })
    .attr('title', faker.lorem.sentence);
};
