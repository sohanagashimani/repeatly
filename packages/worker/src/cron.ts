import cronParser from "cron-parser";
import * as cronValidator from "cron-validator";

export const getNextRunTime = (
  cron: string,
  timezone: string = "UTC",
  currentTime?: Date
): Date => {
  if (!cronValidator.isValidCron(cron)) {
    throw new Error(`Invalid cron expression: ${cron}`);
  }

  try {
    const options = {
      currentDate: currentTime || new Date(),
      tz: timezone,
    };

    const interval = cronParser.parse(cron, options);
    return interval.next().toDate();
  } catch (error) {
    throw new Error(`Failed to parse cron expression "${cron}": ${error}`);
  }
};
