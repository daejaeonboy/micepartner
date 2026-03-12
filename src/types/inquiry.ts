export type InquiryStatus = 'new' | 'in_progress' | 'completed';

export type Inquiry = {
  id: string;
  organizationName: string;
  contactName: string;
  email: string;
  eventDate: string;
  message: string;
  status: InquiryStatus;
  notes: string;
  createdAt: string;
};

export type InquiryInput = {
  organizationName: string;
  contactName: string;
  email: string;
  eventDate: string;
  message: string;
};
