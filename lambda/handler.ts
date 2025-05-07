export const main = async (event: any) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Lambda triggered by EventBridge' }),
  };
};