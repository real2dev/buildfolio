import { Redis } from "@upstash/redis";

type Generation = {
  name: string;
  headline: string;
  bio: string;
  sections: Array<{ title: string; items: string[] }>;
  callToAction: string;
};

const memoryStore = new Map<string, Generation>();
const isUpstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    })
  : null;

export async function saveGeneration(id: string, data: Generation) {
  if (redis) {
    await redis.set(`gen:${id}`, data, { ex: 60 * 60 * 24 * 7 });
    return;
  }
  memoryStore.set(id, data);
}

export async function getGeneration(id: string): Promise<Generation | null> {
  if (redis) {
    const data = (await redis.get(`gen:${id}`)) as Generation | null;
    return data ?? null;
  }
  return memoryStore.get(id) ?? null;
}
