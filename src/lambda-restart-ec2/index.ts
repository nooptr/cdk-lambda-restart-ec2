const AWS = require('aws-sdk');

const instanceIds = process.env.INSTANCE_IDS?.split(",");
const region = 'ap-northeast-1';

async function main(event: { body: any, [key: string]: any }) {
  console.log(event);
  const {actionType} = event;

  const ec2 = new AWS.EC2({ region });

  if (actionType === 'start') {
    return ec2.startInstances({ InstanceIds: instanceIds }).promise()
      .then(() => `Successfully started ${instanceIds} 🎉`)
      .catch((err: any) => console.log(err));
  } else if (actionType === 'stop') {
    return ec2.stopInstances({ InstanceIds: instanceIds }).promise()
      .then(() => `Successfully stopped ${instanceIds} 🎉`)
      .catch((err: any) => console.log(err));
  }

  return Promise.resolve("Skipped");
}

module.exports = { main };
