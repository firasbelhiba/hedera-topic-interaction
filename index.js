const {
  AccountId,
  PrivateKey,
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  // Create a new topic
  // A topic will provide us an address ans then we can send messages to this specific address
  // A new consensus topic is created on the Hedera network. Topics in Hedera are like channels where messages can be published and subscribed to.
  let transactionResponse = await new TopicCreateTransaction().execute(client);

  // Grab the topic ID
  // After creating the topic, its ID is retrieved. This ID is essential for sending messages to or subscribing to this topic.
  let receipt = await transactionResponse.getReceipt(client);
  let topicId = receipt.topicId;

  console.log(`Topic ID: ${topicId}`);

  // wait 5 seconds between consensus topic creation and subscription topic creation
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Subscribe to the topic
  // The code subscribes to the topic created earlier. Whenever a new message is published to this topic, the callback function logs the message's timestamp, sequence number, and content.
  new TopicMessageQuery().setTopicId(topicId).subscribe(client, (message) => {
    let messageAsString = Buffer.from(message.contents, "utf8").toString();
    console.log(
      `${message.consensusTimestamp.toDate()} - Sequence number: ${
        message.sequenceNumber
      } - Message: ${messageAsString}`
    );
  });

  // Send a message
  let sendResponse = await new TopicMessageSubmitTransaction({
    topicId,
    message: "Hello World!",
  }).execute(client);

  // Get the receipt of the transaction
  const getReceipt = await sendResponse.getReceipt(client);

  // Get the status of the transaction
  const txStatus = getReceipt.status;
  console.log(`Transaction Status: ${txStatus.toString()}`);

  client.close();
}

main();
