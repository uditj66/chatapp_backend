import amqp from "amqplib";
let channel: amqp.Channel;
export const connectionToRabbitMq = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.RABBITMQ_HOST,
      port: 5672,
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
    });
    channel = await connection.createChannel();
    console.log("🎉🎉 RabbitMq connected successffuly");
  } catch (error) {
    console.error(error);
  }
};
export const publishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    console.error("rabbitmq is not channelized");
    return;
  }
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};
