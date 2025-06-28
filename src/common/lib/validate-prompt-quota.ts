"use server";
import { AnonymousUser } from "../models/schema";
import devLogger from "../utils/dev-logger";

const MAX_ANONYMOUS_PROMPTS_PER_24_HOURS = 5;
const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;



export default async function validatePromptQuota(ipAddress: string): Promise<boolean> { // Checks if the anonymous user has exceeded their prompt quota
  let anonymousUser = await AnonymousUser.findOne({ ipAddr: ipAddress }); // Find existing anonymous user by IP address & updates the limits for user
  if (!anonymousUser) {
    try {
      anonymousUser = await AnonymousUser.create({
        ipAddr: ipAddress,
        queryCount: 1
      });
      return true;
    } catch (error) {
      devLogger.error("Error creating anonymous user:", error);
      return false;
    }
  }

  const now = new Date();
  const firstQueryTime = anonymousUser.firstQueryAt.getTime();

  if (now.getTime() - firstQueryTime >= TWENTY_FOUR_HOURS_IN_MS) {
    anonymousUser.queryCount = 1;
    anonymousUser.firstQueryAt = now;
    anonymousUser.lastQueryAt = now;
    await anonymousUser.save();
    return true;
  } else {
    if (anonymousUser.queryCount < MAX_ANONYMOUS_PROMPTS_PER_24_HOURS) {
      anonymousUser.queryCount += 1;
      anonymousUser.lastQueryAt = now;
      await anonymousUser.save();
      return true;
    } else {
      devLogger.warn(`Anonymous user ${ipAddress} exceeded prompt quota.`);
      return false;
    }
  }
}
