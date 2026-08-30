export type Role = "SUPER_ADMIN" | "DOCTOR" | "STAFF";

export type ConversationState =
  | "IDLE"
  | "SELECT_SERVICE"
  | "SELECT_DATE"
  | "SELECT_TIME"
  | "COLLECT_NAME"
  | "CONFIRM_BOOKING"
  | "BOOKED"
  | "RESCHEDULING_SELECT_TIME"
  | "CANCELLING_CONFIRM"
  | "HUMAN_TAKEOVER";

export type HandoffStatus = "AI_ACTIVE" | "HUMAN_ACTIVE" | "CLOSED";

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";

export type IntentType =
  | "GREETING"
  | "THANK_YOU"
  | "GOODBYE"
  | "WORKING_HOURS"
  | "LOCATION"
  | "PHONE"
  | "DOCTORS"
  | "SERVICES"
  | "PRICES"
  | "BOOK_APPOINTMENT"
  | "RESCHEDULE_APPOINTMENT"
  | "CANCEL_APPOINTMENT"
  | "CONFIRMATION"
  | "REJECTION"
  | "HUMAN_HANDOFF"
  | "COMPLAINT"
  | "UNKNOWN"
  | "MEDICAL_REQUEST"
  | "EMERGENCY";

export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN" as Role,
  DOCTOR: "DOCTOR" as Role,
  STAFF: "STAFF" as Role,
};

export const ConversationState = {
  IDLE: "IDLE" as ConversationState,
  SELECT_SERVICE: "SELECT_SERVICE" as ConversationState,
  SELECT_DATE: "SELECT_DATE" as ConversationState,
  SELECT_TIME: "SELECT_TIME" as ConversationState,
  COLLECT_NAME: "COLLECT_NAME" as ConversationState,
  CONFIRM_BOOKING: "CONFIRM_BOOKING" as ConversationState,
  BOOKED: "BOOKED" as ConversationState,
  RESCHEDULING_SELECT_TIME: "RESCHEDULING_SELECT_TIME" as ConversationState,
  CANCELLING_CONFIRM: "CANCELLING_CONFIRM" as ConversationState,
  HUMAN_TAKEOVER: "HUMAN_TAKEOVER" as ConversationState,
};

export const HandoffStatus = {
  AI_ACTIVE: "AI_ACTIVE" as HandoffStatus,
  HUMAN_ACTIVE: "HUMAN_ACTIVE" as HandoffStatus,
  CLOSED: "CLOSED" as HandoffStatus,
};

export const AppointmentStatus = {
  SCHEDULED: "SCHEDULED" as AppointmentStatus,
  COMPLETED: "COMPLETED" as AppointmentStatus,
  CANCELLED: "CANCELLED" as AppointmentStatus,
  NO_SHOW: "NO_SHOW" as AppointmentStatus,
  RESCHEDULED: "RESCHEDULED" as AppointmentStatus,
};

export const IntentType = {
  GREETING: "GREETING" as IntentType,
  THANK_YOU: "THANK_YOU" as IntentType,
  GOODBYE: "GOODBYE" as IntentType,
  WORKING_HOURS: "WORKING_HOURS" as IntentType,
  LOCATION: "LOCATION" as IntentType,
  PHONE: "PHONE" as IntentType,
  DOCTORS: "DOCTORS" as IntentType,
  SERVICES: "SERVICES" as IntentType,
  PRICES: "PRICES" as IntentType,
  BOOK_APPOINTMENT: "BOOK_APPOINTMENT" as IntentType,
  RESCHEDULE_APPOINTMENT: "RESCHEDULE_APPOINTMENT" as IntentType,
  CANCEL_APPOINTMENT: "CANCEL_APPOINTMENT" as IntentType,
  CONFIRMATION: "CONFIRMATION" as IntentType,
  REJECTION: "REJECTION" as IntentType,
  HUMAN_HANDOFF: "HUMAN_HANDOFF" as IntentType,
  COMPLAINT: "COMPLAINT" as IntentType,
  UNKNOWN: "UNKNOWN" as IntentType,
  MEDICAL_REQUEST: "MEDICAL_REQUEST" as IntentType,
  EMERGENCY: "EMERGENCY" as IntentType,
};
