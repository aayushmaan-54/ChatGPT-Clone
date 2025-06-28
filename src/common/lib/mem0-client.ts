import MemoryClient from 'mem0ai';


const apiKey = process.env.MEM0_API_KEY;
const mem0Client = new MemoryClient({ apiKey: apiKey as string });


export default mem0Client;
