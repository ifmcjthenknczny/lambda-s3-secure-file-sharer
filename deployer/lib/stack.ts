import {
    Duration,
    RemovalPolicy,
    Size,
    Stack,
    StackProps,
    aws_lambda as lambda,
    aws_logs as logs,
    CfnOutput,
} from 'aws-cdk-lib'

import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway'

import { Construct } from 'constructs'
import { env } from './env'

const ARCHITECTURE = lambda.Architecture.ARM_64
const LAMBDA_APP_RESOURCE_NAME = 'LambdaApp_CV'
const NODE_MODULES_RESOURCE_NAME = 'NodeModules_CV'
// const RESOURCE_ID = '*'
const RUNTIME = lambda.Runtime.NODEJS_22_X

class Site extends Stack {
    constructor(scope: Construct, name: string, stackProps: StackProps) {
        super(scope, name, stackProps)

        // LAMBDA
        const nodeModules = new lambda.LayerVersion(
            this,
            NODE_MODULES_RESOURCE_NAME,
            {
                code: lambda.Code.fromAsset(NODE_MODULES_RESOURCE_NAME),
                description: `Stack ${this.stackName} Layer ${NODE_MODULES_RESOURCE_NAME}`,
                removalPolicy: RemovalPolicy.DESTROY,
            },
        )

        const lambdaApp = new lambda.Function(this, LAMBDA_APP_RESOURCE_NAME, {
            architecture: ARCHITECTURE,
            code: lambda.Code.fromAsset(LAMBDA_APP_RESOURCE_NAME),
            description: `Stack ${this.stackName} Function ${LAMBDA_APP_RESOURCE_NAME}`,
            ephemeralStorageSize: Size.mebibytes(512),
            handler: 'lambda-starter.handler',
            layers: [nodeModules],
            memorySize: 128,
            runtime: RUNTIME,
            timeout: Duration.seconds(60),
            tracing: lambda.Tracing.ACTIVE,
            retryAttempts: 2,
            environment: {
                BUCKET_NAME: env.BUCKET_NAME,
                EXPIRATION_DATE: env.EXPIRATION_DATE,
                DATABASE_NAME: env.DATABASE_NAME,
                MONGO_URI: env.MONGO_URI,
            },
        })

        new logs.LogGroup(this, 'LogGroup', {
            logGroupName: `/aws/lambda/${lambdaApp.functionName}`,
            retention: logs.RetentionDays.TWO_WEEKS,
        })

        const api = new LambdaRestApi(this, 'ApiGateway', {
            handler: lambdaApp,
            proxy: true,
        })

        new CfnOutput(this, 'ApiUrl', {
            value: api.url,
        })
    }
}

export default Site
