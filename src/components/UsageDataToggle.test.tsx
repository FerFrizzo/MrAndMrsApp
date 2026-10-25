import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

const mockIsOptedOut = jest.fn(async () => false);
const mockSetOptOut = jest.fn(async (_v: boolean) => {});
jest.mock("../lib/analytics", () => ({
  isOptedOut: () => mockIsOptedOut(),
  setOptOut: (v: boolean) => mockSetOptOut(v),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        {
          "account.privacy": "Privacy",
          "account.shareUsageData": "Share usage data",
          "account.shareUsageDataHelp": "Helps improve Mr & Mrs.",
        } as Record<string, string>
      )[key] ?? key,
  }),
}));

import { UsageDataToggle } from "./UsageDataToggle";

beforeEach(() => jest.clearAllMocks());

it("shows sharing on by default", async () => {
  const { getByLabelText } = render(<UsageDataToggle />);
  await waitFor(() => expect(getByLabelText("Share usage data").props.value).toBe(true));
});

it("reflects a stored opt-out", async () => {
  mockIsOptedOut.mockResolvedValueOnce(true);
  const { getByLabelText } = render(<UsageDataToggle />);
  await waitFor(() => expect(getByLabelText("Share usage data").props.value).toBe(false));
});

it("turning sharing off opts out", async () => {
  const { getByLabelText } = render(<UsageDataToggle />);
  const toggle = getByLabelText("Share usage data");
  await act(async () => {
    fireEvent(toggle, "valueChange", false);
  });
  expect(mockSetOptOut).toHaveBeenCalledWith(true);
  expect(getByLabelText("Share usage data").props.value).toBe(false);
});
