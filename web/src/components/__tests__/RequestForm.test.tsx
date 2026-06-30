// @vitest-environment jsdom
import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { RequestForm } from "../RequestForm";
import type { RequestFormState } from "../../request/types";

const form = (over: Partial<RequestFormState> = {}): RequestFormState => ({
  method: "GET", route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }], query: [], headers: [], body: "",
  ...over,
});

/** Stateful harness so table edits flow back through onChange and re-render. */
const Harness = ({ initial }: { initial: RequestFormState }) => {
  const [f, setF] = useState(initial);
  return <RequestForm form={f} onChange={setF} onFire={() => {}} firing={false} />;
};

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

  it("auto-adds a trailing draft row when the last query name is filled", () => {
    render(<Harness initial={form({ query: [] })} />);
    const table = screen.getByRole("table", { name: "Query" });
    expect(within(table).getAllByPlaceholderText("name")).toHaveLength(1);

    fireEvent.change(within(table).getAllByPlaceholderText("name")[0], { target: { value: "page" } });
    expect(within(table).getAllByPlaceholderText("name")).toHaveLength(2);
  });

  it("collapses the trailing draft row when a query row is cleared back to empty", () => {
    render(<Harness initial={form({ query: [{ name: "page", value: "1" }] })} />);
    const table = screen.getByRole("table", { name: "Query" });
    expect(within(table).getAllByPlaceholderText("name")).toHaveLength(2);

    fireEvent.change(within(table).getByDisplayValue("page"), { target: { value: "" } });
    fireEvent.change(within(table).getByDisplayValue("1"), { target: { value: "" } });
    expect(within(table).getAllByPlaceholderText("name")).toHaveLength(1);
  });

  it("removes a query row via its trash button", () => {
    render(<Harness initial={form({ query: [{ name: "page", value: "1" }] })} />);
    const table = screen.getByRole("table", { name: "Query" });
    fireEvent.click(within(table).getByRole("button", { name: /remove/i }));
    expect(within(table).queryByDisplayValue("page")).toBeNull();
    expect(within(table).getAllByPlaceholderText("name")).toHaveLength(1);
  });

  it("renders path params as a fixed table with no add or remove controls", () => {
    render(<Harness initial={form()} />);
    const table = screen.getByRole("table", { name: "Path" });
    expect(within(table).queryAllByPlaceholderText("name")).toHaveLength(0);
    expect(within(table).queryByRole("button", { name: /remove/i })).toBeNull();

    fireEvent.change(within(table).getByDisplayValue("2"), { target: { value: "9" } });
    expect(within(table).getByText("id")).toBeTruthy();
    expect(within(table).getByDisplayValue("9")).toBeTruthy();
  });
});
