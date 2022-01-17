import { useEffect, useRef } from "react";
import { ActionFunction, Form, LoaderFunction, redirect, useActionData, useLoaderData, useTransition } from "remix";
import invariant from "tiny-invariant";
import { editPost, getRawPost } from "~/post";

type EditError = {
    newTitle?: boolean;
    newSlug?: boolean;
    newMarkdown?: boolean;
};

export const loader: LoaderFunction = async ({ params }) => {
    invariant(params.editPostSlug, "Expected params.editPostSlug");
    return getRawPost(params.editPostSlug);
};

export const action: ActionFunction = async ({ request }) => {
    await new Promise(res => setTimeout(res, 1000));

    const formData = await request.formData();

    const oldSlug = formData.get("oldSlug");
    const newTitle = formData.get("title");
    const newSlug = formData.get("slug");
    const newMarkdown = formData.get("markdown");

    const errors: EditError = {}
    if (!newTitle) errors.newTitle = true;
    if (!newSlug) errors.newSlug = true;
    if (!newMarkdown) errors.newMarkdown = true;

    if (Object.keys(errors).length) {
        return errors;
    }

    invariant(typeof oldSlug === "string");
    invariant(typeof newTitle === "string");
    invariant(typeof newSlug === "string");
    invariant(typeof newMarkdown === "string");
    await editPost({ oldSlug, newTitle, newSlug, newMarkdown });

    return redirect("/admin");
};

export default function EditPost() {
    const post = useLoaderData();
    const errors = useActionData();
    const transition = useTransition();

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (formRef.current) {
            formRef.current.reset();
        }
    }, []);

    return (
        <Form method="post" ref={formRef}>
            <input hidden type="text" name="oldSlug" defaultValue={post.slug} />
            <p>
                <label>
                    Post Title:{" "}
                    {errors?.title ? (
                        <em>Title is required</em>
                    ) : null}
                    <input type="text" name="title" defaultValue={post.title} />
                </label>
            </p>
            <p>
                <label>
                    Post Slug:{" "}
                    {errors?.slug ? <em>Slug is required</em> : null}
                    <input type="text" name="slug" defaultValue={post.slug} />
                </label>
            </p>
            <p>
                <label htmlFor="markdown">Markdown:</label>{" "}
                {errors?.markdown ? (
                    <em>Markdown is required</em>
                ) : null}
                <br />
                <textarea rows={20} name="markdown" defaultValue={post.markdown} />
            </p>
            <p>
                <button type="submit">
                    {transition.submission
                        ? "Updating..."
                        : "Update Post"}
                </button>
            </p>
        </Form>
    );
};
