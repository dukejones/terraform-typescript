import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider, ec2, vpc } from "@cdktf/provider-aws";
import { readFileSync, writeFileSync } from "fs";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const ubuntuWest1Ami = "ami-01f87c43e618bf8f0";

    const bootstrapScript = readFileSync("bootstrap.sh", "utf8");

    new AwsProvider(this, "AWS", {
      region: "us-west-1",
    });

    const keypair = new ec2.KeyPair(this, "KeyPair", {
      keyName: "deployer-west-1",
      publicKey:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBeN9WjVKaH2osrHU9LlPuVU1pI4nbPOvTVhCkZK5OK9",
    });

    const securityGroup = new vpc.SecurityGroup(this, "default", {
      egress: [
        {
          cidrBlocks: ["0.0.0.0/0"],
          fromPort: 0,
          protocol: "tcp",
          toPort: 65535,
        },
      ],
      ingress: [
        {
          cidrBlocks: ["0.0.0.0/0"],
          fromPort: 0,
          protocol: "tcp",
          toPort: 65535,
        },
        {
          cidrBlocks: ["0.0.0.0/0"],
          fromPort: -1,
          protocol: "icmp",
          toPort: -1,
        },
      ],
      name: "sgswarmcluster",
    });

    const manager = new ec2.Instance(this, "manager", {
      ami: ubuntuWest1Ami,
      instanceType: "t3.micro",
      tags: {
        Name: "Manager",
        Access: "open",
      },
      keyName: keypair.keyName,
      vpcSecurityGroupIds: [securityGroup.id],
      userData: bootstrapScript,
    });
    new TerraformOutput(this, "manager_public_ip", {
      value: manager.publicIp,
    });

    const workers = [];
    for (let i = 0; i < 2; i++) {
      workers.push(
        new ec2.Instance(this, `worker${i}`, {
          ami: ubuntuWest1Ami,
          instanceType: "t3.micro",
          tags: {
            Name: `Worker ${i}`,
            Access: "open",
          },
          keyName: keypair.keyName,
          vpcSecurityGroupIds: [securityGroup.id],
          userData: bootstrapScript,
        })
      );
      new TerraformOutput(this, `worker${i}_public_ip`, {
        value: workers[i].publicIp,
      });
    }
  }
}

const app = new App();
const stack = new MyStack(app, "aws_instance");

// new RemoteBackend(stack, {
//   hostname: "app.terraform.io",
//   organization: "<YOUR_ORG>",
//   workspaces: {
//     name: "learn-cdktf",
//   },
// });

app.synth();
