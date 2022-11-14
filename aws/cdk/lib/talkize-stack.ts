import { CfnResource, Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

export class TalkizeStack extends Stack {
  #applicationEnv: string;
  #talkTableName: string;
  #talkTablePolicies: Map<'PutItem' | 'Query', ManagedPolicy> = new Map();

  #talkRestApi: RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.#applicationEnv = process.env.APPLICATION_ENVIRONMENT || 'development'

    this.addTalkTable();
    this.addTalkRestApi();
    this.addCreateTalkFunction();
    this.addGetTalksFunction();
  }

  private addTalkTable() {
    const talkTableLogicialId = 'TalkTable';
    const talkTableId = `${this.#applicationEnv}-talk-table`;

    const talkTable = new Table(this, talkTableId, {
      tableName: talkTableId,
      partitionKey: {
        name: 'partitionKey',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sortKey',
        type: AttributeType.STRING,
      },
      removalPolicy: !this.isDevelopmentEnvironment()
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: !this.isDevelopmentEnvironment(),
    });

    this.tagResource(talkTable);
    this.setLogicalId(talkTable, talkTableLogicialId);

    this.#talkTableName = talkTableId;

    const policies = ['PutItem', 'Query'] as const;

    policies.forEach((action) => {
      const talkTablePolicyLogicialId = `TalkTable${action}Policy`;
      const managedPolicyId = `${this.#applicationEnv}-talk-table-${action.toLowerCase()}-policy`;

      const managedPolicy = new ManagedPolicy(this, managedPolicyId, {
        managedPolicyName: managedPolicyId,
        document: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [`dynamodb:${action}`],
              resources: [talkTable.tableArn],
            }),
          ],
        }),
      });

      this.tagResource(managedPolicy);
      this.setLogicalId(managedPolicy, talkTablePolicyLogicialId);

      this.#talkTablePolicies.set(action, managedPolicy);
    });
  }

  private addTalkRestApi() {
    const talkRestApiLogicialId = 'TalkRestApi';
    const talkRestApiId = `${this.#applicationEnv}-talk-rest-api`;

    const talkRestApi = new RestApi(this, talkRestApiId, {
      restApiName: 'talks'
    });

    talkRestApi.root.addResource('talks');

    this.tagResource(talkRestApi);
    this.setLogicalId(talkRestApi, talkRestApiLogicialId);

    this.#talkRestApi = talkRestApi;
  }

  private addCreateTalkFunction() {
    const createTalkFunctionLogicialId = 'CreateTalkFunction';
    const createTalkFunctionId = `${this.#applicationEnv}-create-talk-function`;

    const createTalkFunction = new NodejsFunction(this, createTalkFunctionId, {
      functionName: createTalkFunctionId,
      handler: 'handler',
      memorySize: 256,
      timeout: Duration.seconds(6),
      runtime: Runtime.NODEJS_16_X,
      entry: join(__dirname, '..', '..', '..', 'packages', 'createTalk', 'src', 'index.ts')
    });

    createTalkFunction.addEnvironment('TALK_TABLE_NAME', this.#talkTableName);
    createTalkFunction.role?.addManagedPolicy(this.#talkTablePolicies.get('PutItem') as ManagedPolicy)

    this.tagResource(createTalkFunction);
    this.setLogicalId(createTalkFunction, createTalkFunctionLogicialId);

    this.#talkRestApi.root.getResource('talks')?.addMethod('POST', new LambdaIntegration(createTalkFunction, {proxy: true}))
  }

  private addGetTalksFunction() {
    const getTalksFunctionLogicialId = 'GetTalksFunction';
    const getTalksFunctionId = `${this.#applicationEnv}-get-talks-function`;

    const getTalksFunction = new NodejsFunction(this, getTalksFunctionId, {
      functionName: getTalksFunctionId,
      handler: 'handler',
      memorySize: 256,
      timeout: Duration.seconds(6),
      runtime: Runtime.NODEJS_16_X,
      entry: join(__dirname, '..', '..', '..', 'packages', 'getTalks', 'src', 'index.ts')
    });

    getTalksFunction.addEnvironment('TALK_TABLE_NAME', this.#talkTableName);
    getTalksFunction.role?.addManagedPolicy(this.#talkTablePolicies.get('Query') as ManagedPolicy)

    this.tagResource(getTalksFunction);
    this.setLogicalId(getTalksFunction, getTalksFunctionLogicialId);

    this.#talkRestApi.root.getResource('talks')?.addMethod('GET', new LambdaIntegration(getTalksFunction, {proxy: true}))
  }

  private isDevelopmentEnvironment() {
    return this.#applicationEnv !== 'staging' && this.#applicationEnv !== 'production';
  }

  private tagResource(resource: Construct) {
    Tags.of(resource).add('environment', this.#applicationEnv);
    Tags.of(resource).add('deploy-mode', 'cloudformation');
    Tags.of(resource).add('project', 'talkize');
    Tags.of(resource).add('version', process.env.APPLICATION_VERSION || 'none');
  }

  private setLogicalId(resource: Construct, logicalId: string) {
    (resource.node.defaultChild as CfnResource).overrideLogicalId(logicalId);
  }
}
