import path from "path";
import fs from "fs/promises";
import parseFrontMatter from "front-matter";
import invariant from "tiny-invariant";
import { marked } from "marked";

const postsPath = path.join(__dirname, "..", "posts");

export type Post = {
    slug: string;
    title: string;
};

export type PostMarkdownAttributes = {
    title: string;
}

export type NewPost = {
    title: string;
    slug: string;
    markdown: string;
}

export type EditPost = {
    oldSlug: string;
    newTitle: string;
    newSlug: string;
    newMarkdown: string;
}

function isValidPostAttributes(attributes: any): attributes is PostMarkdownAttributes {
    return attributes?.title;
};

export async function getPosts() {
    const dir = await fs.readdir(postsPath);
    return Promise.all(
        dir.map(async filename => {
            const file = await fs.readFile(
                path.join(postsPath, filename)
            );

            const { attributes } = parseFrontMatter(
                file.toString()
            );

            invariant(
                isValidPostAttributes(attributes),
                `${filename} has bad meta data!`
            );

            return {
                slug: filename.replace(/\.md$/, ""),
                title: attributes.title
            };
        })
    );
}

export async function getRawPost(slug: string) {
    const filepath = path.join(postsPath, slug + ".md");
    const file = await fs.readFile(filepath);
    const { attributes, body } = parseFrontMatter(file.toString());

    invariant(
        isValidPostAttributes(attributes),
        `Post ${filepath} is missing attributes`
    );

    return { slug, title: attributes.title, markdown: body };
};

export async function getPost(slug: string) {
    const rawPost = await getRawPost(slug);
    const html = marked(rawPost.markdown);
    return { slug, title: rawPost.title, html };
};

export async function createPost(post: NewPost) {
    const md = `---\ntitle: ${post.title}\n---\n\n${post.markdown}`;
    await fs.writeFile(
        path.join(postsPath, post.slug + '.md'),
        md
    );
    return getPost(post.slug);
};

export async function editPost(post: EditPost) {
    await fs.rm(path.join(postsPath, post.oldSlug + '.md'));
    await createPost({ title: post.newTitle, slug: post.newSlug, markdown: post.newMarkdown });
}
