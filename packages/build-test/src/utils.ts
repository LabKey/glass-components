
export function thing (num: number[]) {
    // Should not compile because props.nums.at is ES2022, and our build lib is ES2021
    console.log(num.at(-1));
}
