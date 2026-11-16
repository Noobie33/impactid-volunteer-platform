import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { confirmedHours } from "@/modules/verification/verification.service";
import {
  ApproveVerificationDto,
  RevokeVerificationDto,
} from "@/modules/verification/dto/verification.dto";
import { PageDto } from "@/modules/audit-log/dto/audit-log.dto";
import { ReviewFraudFlagDto } from "@/modules/fraud-flag/dto/fraud-flag.dto";

describe("verification input", () => {
  const start = new Date("2026-01-01T12:00Z");
  const end = new Date("2026-01-01T16:00Z");
  const completed = new Date("2026-01-01T14:30Z");
  it.each([null, -1, "NaN", "2.501", "2.51", "1000000.00"])(
    "rejects invalid or unavailable hours %p",
    (hours) => {
      expect(() => confirmedHours(true, hours, start, end, completed)).toThrow(
        BadRequestException,
      );
    },
  );
  it("accepts exactly the elapsed time and keeps decimal precision", () => {
    expect(confirmedHours(true, "2.50", start, end, completed)).toBe("2.50");
  });
  it("keeps non-time-based verification free of credit", () => {
    expect(confirmedHours(false, null, start, end, completed)).toBeNull();
    expect(() => confirmedHours(false, 1, start, end, completed)).toThrow(
      BadRequestException,
    );
  });
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  it.each([
    [ApproveVerificationDto, { verifierId: "forged" }],
    [ApproveVerificationDto, { confirmedHours: null }],
    [RevokeVerificationDto, { reason: "   " }],
    [ReviewFraudFlagDto, { status: "OPEN" }],
    [PageDto, { limit: 101 }],
  ] as const)("rejects invalid %p input", async (metatype, input) => {
    await expect(
      pipe.transform(input, { type: "body", metatype }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it("applies pagination defaults", async () => {
    await expect(
      pipe.transform({}, { type: "query", metatype: PageDto }),
    ).resolves.toMatchObject({ page: 1, limit: 10 });
  });
});
