import { TerraformState } from "./src/TerraformState";
import { App, S3Backend, TerraformStack } from "cdktf";
import { SwarmTest } from "./src/SwarmTest";

const app = new App();

new TerraformState(app, "terraform-state");

// Generate the stack using Terraform State to keep multiple users from making changes to the same stack
function genStack(StackClass: typeof TerraformStack, stackName: string) {
  const stack = new StackClass(app, stackName);

  new S3Backend(stack, {
    bucket: "resource-terraform",
    key: `terraform.${stackName}.tfstate`,
    region: "us-east-2",
    encrypt: true,
    dynamodbTable: "terraform-state",
  });
}

genStack(SwarmTest, "test-swarm");

app.synth();
