import example from "../index";

describe('example', () => {
  it('should return an example string', () => {
    expect(example()).toBe("example");
  });
});