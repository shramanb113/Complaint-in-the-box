import { computeDeadlineYMD, type YMD } from "./dates";
import type { Packet } from "./types";

/** The response deadline of a stored packet: creation day (IST) + the intake's deadlineDays. */
export function packetDeadline(packet: Packet): YMD {
  return computeDeadlineYMD(packet.intake.deadlineDays, new Date(packet.createdAt));
}
