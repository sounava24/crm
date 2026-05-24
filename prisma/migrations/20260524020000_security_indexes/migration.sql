CREATE INDEX "Admin_clientId_idx" ON "Admin"("clientId");

CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

CREATE INDEX "OtpToken_email_idx" ON "OtpToken"("email");
CREATE INDEX "OtpToken_userId_idx" ON "OtpToken"("userId");
CREATE INDEX "OtpToken_purpose_idx" ON "OtpToken"("purpose");
CREATE INDEX "OtpToken_usedAt_idx" ON "OtpToken"("usedAt");
CREATE INDEX "OtpToken_createdAt_idx" ON "OtpToken"("createdAt");
