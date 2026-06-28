// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RequestForm } from "../RequestForm";
import type { RequestFormState } from "../../request/types";

const form = (over: Partial<RequestFormState> = {}): RequestFormState => ({
  method: "GET", route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }], query: [], headers: [], body: "",
  ...over,
});

afterEach(cleanup);

describe("RequestForm", () => {
  it("fires when the form is valid", () => {
    const onFire = vi.fn();
    render(<RequestForm form={form()} onChange={() => {}} onFire={onFire} firing={false} />);
    fireEvent.click(screen.getByRole("button", { name: /try it out/i }));
    expect(onFire).toHaveBeenCalledOnce();
  });

  it("blocks firing and shows the reason when a redacted header is empty", () => {
    const onFire = vi.fn();
    render(
      <RequestForm
        form={form({ headers: [{ name: "authorization", value: "", needsInput: true }] })}
        onChange={() => {}}
        onFire={onFire}
        firing={false}
      />
    );
    expect(screen.getByText(/was redacted — enter a value/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /try it out/i })).toHaveProperty("disabled", true);
  });

  it("edits a path param through onChange", () => {
    const onChange = vi.fn();
    render(<RequestForm form={form()} onChange={onChange} onFire={() => {}} firing={false} />);
    fireEvent.change(screen.getByDisplayValue("2"), { target: { value: "9" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ pathParams: [{ name: "id", value: "9" }] }));
  });
});
