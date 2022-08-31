import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, S3Backend } from "cdktf";
import { AwsProvider, ec2, vpc } from "@cdktf/provider-aws";
import { readFileSync } from "fs";

export class SwarmTest extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const region = "us-west-1";
    const managerInstanceType = "t3.small";
    const workerInstanceType = "t3.small";
    const ubuntuWest1Ami = "ami-01f87c43e618bf8f0";

    const bootstrapScript = readFileSync("bootstrap.sh", "utf8");

    new AwsProvider(this, "AWS", {
      region: region,
    });

    // ! Did this just get destroyed when bringing the stack down?
    const keypair = new ec2.KeyPair(this, "KeyPair", {
      keyName: "deployer-west-1",
      publicKey:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBeN9WjVKaH2osrHU9LlPuVU1pI4nbPOvTVhCkZK5OK9",
    });

    // TODO: Route docker swarm traffic over private network
    // TODO: Open UDP ports are required
    // TCP port 2377 for cluster management communications
    // TCP and UDP port 7946 for communication among nodes
    // UDP port 4789 for overlay network traffic
    const securityGroup = new vpc.SecurityGroup(this, "default", {
      egress: [
        {
          cidrBlocks: ["0.0.0.0/0"],
          fromPort: 0,
          protocol: "tcp",
          toPort: 65535,
        },
        {
          cidrBlocks: ["0.0.0.0/0"],
          fromPort: 0,
          protocol: "udp",
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
          fromPort: 0,
          protocol: "udp",
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

    // ? Do we need to attach a EBS volume here? For downloading docker images.
    // Note that when we have multiple managers, explore shared network storage volume, NFS or Gluster etc.
    const manager = new ec2.Instance(this, "manager", {
      ami: ubuntuWest1Ami,
      instanceType: managerInstanceType,
      tags: {
        Name: "Swarm Manager",
        Access: "open",
      },
      keyName: keypair.keyName,
      vpcSecurityGroupIds: [securityGroup.id],
      userData: bootstrapScript,
      iamInstanceProfile: "SwarmNode",
    });
    // TODO: Copy github-infra-swarm-key onto the instance as id_ed25519 so it can pull down this repo, chmod 400

    new TerraformOutput(this, "manager0_public_ip", {
      value: manager.publicIp,
    });
    new TerraformOutput(this, "manager0_id", {
      value: manager.id,
    });
    const workers = [];
    for (let i = 0; i < 2; i++) {
      workers.push(
        new ec2.Instance(this, `worker${i}`, {
          ami: ubuntuWest1Ami,
          instanceType: workerInstanceType,
          tags: {
            Name: `Swarm Worker ${i}`,
            Access: "open",
          },
          keyName: keypair.keyName,
          vpcSecurityGroupIds: [securityGroup.id],
          userData: bootstrapScript,
          iamInstanceProfile: "SwarmNode",
        })
      );
      new TerraformOutput(this, `worker${i}_public_ip`, {
        value: workers[i].publicIp,
      });
      new TerraformOutput(this, `worker${i}_id`, {
        value: workers[i].id,
      });
    }
  }
}
