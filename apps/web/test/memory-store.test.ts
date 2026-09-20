import { InMemoryPacketStore, InMemoryRateLimiter } from "../src/server/store/memory";
import { describePacketStore, describeRateLimiter } from "./helpers/store-contract";

describePacketStore("InMemoryPacketStore", async () => new InMemoryPacketStore());
describeRateLimiter("InMemoryRateLimiter", async (limit) => new InMemoryRateLimiter(limit));
