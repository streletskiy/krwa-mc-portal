"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { cloneElement, isValidElement } from "react";

import { buttonVariants } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/utils";

type LinkRenderProps = {
	to?: unknown;
	href?: unknown;
	className?: string;
	"data-slot"?: string;
	"data-theme-surface"?: string;
};

function Button({
	className,
	variant = "default",
	size = "default",
	render,
	nativeButton,
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	const classes = cn(buttonVariants({ variant, size, className }));
	const isLink =
		isValidElement<LinkRenderProps>(render) &&
		("to" in render.props || "href" in render.props);
	if (isLink && !props.disabled) {
		return cloneElement(render, {
			...props,
			"data-slot": "button",
			"data-theme-surface": "control",
			className: cn(classes, render.props.className),
		});
	}
	return (
		<ButtonPrimitive
			data-slot="button"
			data-theme-surface="control"
			className={classes}
			render={render}
			nativeButton={isLink ? false : nativeButton}
			{...props}
		/>
	);
}

export { Button };
