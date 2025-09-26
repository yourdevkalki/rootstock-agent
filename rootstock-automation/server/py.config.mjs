export const isMock = () => process.env.OFFCHAIN_MOCK === "1" || process.env.OFFCHAIN_MOCK === "true";
export const eventsDisabled = () => process.env.DISABLE_EVENT_SUBS === "1" || process.env.DISABLE_EVENT_SUBS === "true";


