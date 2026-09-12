// End-to-end smoke test for the Commons API and pages.
//
//   npm run dev          # in one terminal
//   npm run smoke        # in another
//
// Expects a freshly seeded database (npm run db:seed).
const BASE = process.env.BASE ?? "http://localhost:3000";

let cookie = "";
let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text };
}

async function page(path) {
  const res = await fetch(BASE + path, { headers: cookie ? { Cookie: cookie } : {} });
  return { status: res.status, html: await res.text() };
}

console.log("\n— Public reads —");
const feed = await req("GET", "/api/posts");
check("GET /api/posts returns 200", feed.status === 200, `got ${feed.status}`);
check("feed returns a default page of 20", feed.json?.posts?.length === 20, `got ${feed.json?.posts?.length}`);

const dates = feed.json.posts.map((p) => new Date(p.createdAt).getTime());
check(
  "feed is strictly newest-first",
  dates.every((d, i) => i === 0 || dates[i - 1] >= d),
);
check("posts carry like/comment counts", typeof feed.json.posts[0].likeCount === "number");
check("likedByMe is false when signed out", feed.json.posts.every((p) => p.likedByMe === false));
check("some posts carry media", feed.json.posts.some((p) => p.mediaUrl));

const target = feed.json.posts[0];

console.log("\n— Auth gating (signed out) —");
check("POST /api/posts is 401", (await req("POST", "/api/posts", { content: "nope" })).status === 401);
check("POST like is 401", (await req("POST", `/api/posts/${target.id}/like`)).status === 401);
check(
  "POST comment is 401",
  (await req("POST", `/api/posts/${target.id}/comments`, { body: "nope" })).status === 401,
);
check("PATCH /api/users/me is 401", (await req("PATCH", "/api/users/me", { bio: "x" })).status === 401);

console.log("\n— Registration validation —");
const badReg = await req("POST", "/api/auth/register", {
  username: "a",
  email: "not-an-email",
  password: "123",
  displayName: "",
});
check("short/invalid signup is 422", badReg.status === 422, `got ${badReg.status}`);
check("field errors are returned", !!badReg.json?.errors?.username && !!badReg.json?.errors?.email);

const dupe = await req("POST", "/api/auth/register", {
  username: "ada",
  email: "new@example.com",
  password: "longenough123",
  displayName: "Impostor",
});
check("duplicate username is 409", dupe.status === 409, `got ${dupe.status}`);

console.log("\n— Login —");
check(
  "wrong password is 401",
  (await req("POST", "/api/auth/login", { identifier: "ada", password: "wrong" })).status === 401,
);

const login = await req("POST", "/api/auth/login", {
  identifier: "ada",
  password: "commons123",
});
check("correct password is 200", login.status === 200, `got ${login.status} ${login.text.slice(0, 120)}`);
check("session cookie is set", cookie.startsWith("session="), cookie);

const me = await req("GET", "/api/auth/me");
check("GET /api/auth/me returns ada", me.json?.user?.username === "ada");
check("password hash is never returned", !me.text.includes("passwordHash"));

console.log("\n— Posting —");
const created = await req("POST", "/api/posts", {
  content: "Smoke test post from the API.",
  mediaUrl: "https://picsum.photos/seed/smoke/800/500",
  mediaType: "IMAGE",
});
check("POST /api/posts is 201", created.status === 201, `got ${created.status} ${created.text.slice(0, 200)}`);
const newId = created.json?.post?.id;
check("new post carries media", created.json?.post?.mediaUrl?.includes("picsum"));

const empty = await req("POST", "/api/posts", { content: "   " });
check("empty post is rejected 422", empty.status === 422, `got ${empty.status}`);

const refetched = await req("GET", "/api/posts");
check("new post is first in the feed", refetched.json.posts[0].id === newId);

console.log("\n— Likes —");
const like1 = await req("POST", `/api/posts/${newId}/like`);
check("like returns liked:true", like1.json?.liked === true);
check("like count is 1", like1.json?.likeCount === 1, `got ${like1.json?.likeCount}`);

const like2 = await req("POST", `/api/posts/${newId}/like`);
check("liking twice is idempotent", like2.json?.likeCount === 1, `got ${like2.json?.likeCount}`);

const withLike = await req("GET", "/api/posts");
check("likedByMe is true for the liker", withLike.json.posts[0].likedByMe === true);

const unlike = await req("DELETE", `/api/posts/${newId}/like`);
check("unlike returns 0", unlike.json?.liked === false && unlike.json?.likeCount === 0);
check(
  "unliking twice is idempotent",
  (await req("DELETE", `/api/posts/${newId}/like`)).json?.likeCount === 0,
);

console.log("\n— Comments —");
const comment = await req("POST", `/api/posts/${newId}/comments`, {
  body: "A reply from the smoke test.",
});
check("POST comment is 201", comment.status === 201, `got ${comment.status}`);
check("commentCount is 1", comment.json?.commentCount === 1);
check("comment carries its author", comment.json?.comment?.user?.username === "ada");
check(
  "empty comment is 422",
  (await req("POST", `/api/posts/${newId}/comments`, { body: "" })).status === 422,
);

const comments = await req("GET", `/api/posts/${newId}/comments`);
check("GET comments returns the new one", comments.json?.comments?.length === 1);

const seeded = feed.json.posts.find((p) => p.commentCount > 0);
const seededComments = await req("GET", `/api/posts/${seeded.id}/comments`);
check("seeded comments load", seededComments.json.comments.length === seeded.commentCount);
const times = seededComments.json.comments.map((c) => new Date(c.createdAt).getTime());
check("comments are oldest-first", times.every((t, i) => i === 0 || times[i - 1] <= t));

console.log("\n— Profiles —");
const profile = await req("GET", "/api/users/ada");
check("GET /api/users/ada is 200", profile.status === 200);
check("profile reports counts", profile.json?.user?.postCount > 0 && profile.json?.user?.followerCount > 0);
check("profile is flagged isMe", profile.json?.user?.isMe === true);
check("profile posts are all ada's", profile.json.posts.every((p) => p.author.username === "ada"));
check("unknown user is 404", (await req("GET", "/api/users/nobody-here")).status === 404);

const patched = await req("PATCH", "/api/users/me", {
  displayName: "Ada Okafor",
  bio: "Updated by the smoke test.",
  avatarUrl: "",
});
check("PATCH /api/users/me is 200", patched.status === 200, `got ${patched.status}`);
check("bio was updated", patched.json?.user?.bio === "Updated by the smoke test.");
check("empty avatar becomes null", patched.json?.user?.avatarUrl === null);
check(
  "bad avatar URL is 422",
  (await req("PATCH", "/api/users/me", { avatarUrl: "not-a-url" })).status === 422,
);

console.log("\n— Follows —");
const follow = await req("POST", "/api/users/mira/follow");
check("follow is 200", follow.status === 200 && follow.json?.following === true);
const unfollow = await req("DELETE", "/api/users/mira/follow");
check("unfollow is 200", unfollow.status === 200 && unfollow.json?.following === false);
check("cannot follow yourself", (await req("POST", "/api/users/ada/follow")).status === 400);

console.log("\n— Ownership —");
const otherPost = feed.json.posts.find((p) => p.author.username !== "ada");
check(
  "deleting someone else's post is 403",
  (await req("DELETE", `/api/posts/${otherPost.id}`)).status === 403,
);
check("deleting your own post is 200", (await req("DELETE", `/api/posts/${newId}`)).status === 200);
check("deleted post is 404", (await req("GET", `/api/posts/${newId}`)).status === 404);

console.log("\n— Pages render —");
for (const [path, needle] of [
  ["/", "in the order it was said"],
  ["/u/ada", "@ada"],
  ["/settings", "Edit profile"],
  ["/u/does-not-exist", "Nothing at this address"],
]) {
  const res = await page(path);
  check(`${path} renders`, res.html.includes(needle), `status ${res.status}`);
}

console.log("\n— Sign out —");
await req("POST", "/api/auth/logout");
cookie = "";
check("signed out /api/auth/me is null", (await req("GET", "/api/auth/me")).json?.user === null);

const loginPage = await page("/login");
check("/login renders", loginPage.status === 200 && loginPage.html.includes("Sign in"));
const registerPage = await page("/register");
check("/register renders", registerPage.status === 200 && registerPage.html.includes("Join the square"));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
