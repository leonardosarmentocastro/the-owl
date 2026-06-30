// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CurlBlock } from "../CurlBlock";
import type { RequestFormState } from "../../request/types";

const form: RequestFormState = {
  method: "GET",
  route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }],
  query: [],
  headers: [],
  body: "",
};

afterEach(cleanup);

describe("CurlBlock", () => {
  it("renders the curl command for the form", () => {
    render(<CurlBlock form={form} baseUrl="http://localhost:3000" />);
    expect(screen.getByText(/curl -X GET 'http:\/\/localhost:3000\/users\/2'/)).toBeTruthy();
  });

  it("copies the command to the clipboard when Copy is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CurlBlock form={form} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith("curl -X GET 'http://localhost:3000/users/2'");
  });
});
