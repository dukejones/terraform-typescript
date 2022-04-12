import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider, dynamodb, s3 } from "@cdktf/provider-aws";

export class TerraformState extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: "us-east-2",
    });

    const bucket = new s3.S3Bucket(this, "terraform-state-bucket", {
      bucket: "resource-terraform",
      lifecycle: {
        preventDestroy: true,
      },
      
    });
    new s3.S3BucketVersioningA(this, "terraform-state-bucket-versioning", {
      bucket: bucket.bucket,
      versioningConfiguration: {
        status: "Enabled",
      },
    });
    new s3.S3BucketServerSideEncryptionConfigurationA(this, "terraform-state-bucket-server-side-encryption", { 
      bucket: bucket.bucket,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256",
        }
      }]
    })

    const dynamo = new dynamodb.DynamodbTable(this, "terraform-state-table", {
      name: "terraform-state",
      hashKey: "LockID",
      billingMode: "PAY_PER_REQUEST",
      attribute: [{
        name: "LockID",
        type: "S",
      }]
    });
  }
}
