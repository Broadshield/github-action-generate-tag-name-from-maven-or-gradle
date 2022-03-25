export interface Repo {
  owner: string;
  repo: string;
}

export const BumpType = {
  Patch: 'patch',
  Minor: 'minor',
  Major: 'major',
  Build: 'build',
} as const;
export type Bump = typeof BumpType[keyof typeof BumpType];

// // eslint-disable-next-line no-shadow
// export enum Ordering {
//   GT = 1,
//   LT = -1,
//   EQ = 0
// }

// export interface Ord<A> {
//   compare(x: A, y: A): Ordering
// }

// export const contramap = <A, B>(f: Fn<B, A>, O: Ord<A>): Ord<B> => ({
//   compare: (x: B, y: B) => O.compare(f(x), f(y))
// })

// const stringOrd: Ord<string> = {
//   compare: (x: string, y: string) =>
//     x < y ? Ordering.LT : x > y ? Ordering.GT : Ordering.EQ
// }
// const numOrd: Ord<number> = {
//   compare: (x: number, y: number) =>
//     x < y ? Ordering.LT : x > y ? Ordering.GT : Ordering.EQ
// }
// //extending stringOrd to work on Person objects
// const major: Ord<VersionObject> = contramap(
//   (x: {major: number}) => x.major,
//   numOrd
// )
// const minor: Ord<VersionObject> = contramap(
//   (x: {minor: number}) => x.minor,
//   numOrd
// )
// const patch: Ord<VersionObject> = contramap(
//   (x: {patch: number}) => x.patch,
//   numOrd
// )
// const legacy_build_number: Ord<VersionObject> = contramap(
//   (x: {legacy_build_number: number}) => x.legacy_build_number,
//   numOrd
// )
// const label: Ord<VersionObject> = contramap(
//   (x: {label: string}) => x.label,
//   stringOrd
// )
// const build: Ord<VersionObject> = contramap(
//   (x: {build: number}) => x.build,
//   numOrd
// )
// //Sort by x, then y
// const appendOrdering = (x: Ordering, y: Ordering) => (x === Ordering.EQ ? y : x)

// //combine 2 Ord<A> instances into a new one
// export const append = <A>(x: Ord<A>, y: Ord<A>): Ord<A> => ({
//   compare: (x1: A, y1: A) =>
//     appendOrdering(x.compare(x1, y1), y.compare(x1, y1))
// })

// export const versionSortOrd: Ord<VersionObject> = append(
//   major,
//   minor,
//   patch,
//   legacy_build_number,
//   label,
//   build
// )
