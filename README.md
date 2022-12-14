# Note to future self

Don't use Docker Swarm, ever.
Traefik also -- it's difficult to configure through docker labels alone.

### The good stuff is in:
```
src/SwarmTest.ts
main.ts
```
In package.json, tasks to take the ip addresses from the cdktf output:
`tf-output -> write-hosts-file -> run-ansible`

Explore: APISIX for reverse proxy / ingress

# essentially random notes

## Use AWS Instance Connect

You'll have to get the instance id.

    pip install ec2instanceconnectcli
    mssh -r us-west-1 ubuntu@i-071d972f4ba5da427

docker attachable network

https://rock-it.pl/tips-for-using-docker-swarm-mode-in-production/

https://dockerswarm.rocks/traefik/ - set up internal and external traefik instances

https://www.rockyourcode.com/traefik-2-docker-swarm-setup-with-docker-socket-proxy-and-more/ - good links, icluding protecting docker socket
https://blog.cepharum.de/en/post/install-traefik-in-docker-swarm.html

preferences:

- spread: node.labels.zone

deploy:
mode: global

deploy:
mode: replicated
replicas: 6

version: "3.9"
services:
redis:
image: redis:alpine
deploy:
resources:
limits:
cpus: '0.50'
memory: 50M
reservations:
cpus: '0.25'
memory: 20M

https://docs.docker.com/compose/compose-file/compose-file-v3/#restart_policy
https://docs.docker.com/compose/compose-file/deploy/

https://doc.traefik.io/traefik/user-guides/docker-compose/basic-example/

docker network create --driver overlay --scope swarm --opt encrypted --attachable cloud-socket-proxy
docker network create --driver=overlay --attachable core
git clone git@github.com:ReSource-Network/infra-swarm.git
docker stack deploy -c traefik.yml proxy

### Useful for debugging, access services on the network by name.

docker run --rm --network=core -it alpine:latest sh

TODO: import the deployer key everywhere https://aws.amazon.com/premiumsupport/knowledge-center/ec2-ssh-key-pair-regions/

# Naming

Stacks directory is named after the ECR repository. If you push to 446481105531.dkr.ecr.us-east-2.amazonaws.com/resource-api:staging, you will deploy from:
`stacks/resource-api/staging.yml`


# Ansible stuff

ansible -i hosts -u ubuntu managers -m ansible.builtin.setup
