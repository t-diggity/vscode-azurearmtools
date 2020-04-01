// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// ----------------------------------------------------------------------------

import { MarkdownString } from "vscode";
import { IFunctionMetadata } from "./IFunctionMetadata";
import { IParameterDefinition } from "./IParameterDefinition";
import * as language from "./Language";
import { UserFunctionNamespaceDefinition } from "./UserFunctionNamespaceDefinition";
import { IVariableDefinition } from "./VariableDefinition";

/**
 * A completion item in the list of completion suggestions that appear when a user invokes auto-completion (Ctrl + Space).
 */
export class Item {
    public get label(): string { return this.options.label; }
    public get insertText(): string { return this.options.insertText; }
    public get span(): language.Span { return this.options.span; }
    public get kind(): CompletionKind { return this.options.kind; }
    public get detail(): string | undefined { return this.options.detail; }
    public get documention(): string | MarkdownString | undefined { return this.options.documentation; }
    public get snippetName(): string | undefined { return this.options.snippetName; }
    public get additionalEdits(): { span: language.Span; insertText: string }[] | undefined { return this.options.additionalEdits; }
    public get sortText(): string | undefined { return this.options.sortText; }
    public get commitCharacters(): string[] | undefined { return this.options.commitCharacters; }
    public get highPriority(): boolean { return this.options.highPriority ?? false; }
    public get preselect(): boolean { return this.options.preselect ?? false; }

    constructor(
        private readonly options: {
            label: string;
            insertText: string;
            span: language.Span;
            kind: CompletionKind;
            /**
             * A human-readable string with additional information
             * about this item, like type or symbol information, or the
             * full text that will be inserted (if not in label)
             */
            detail?: string;
            /**
             * A human-readable string that represents a doc-comment.
             */
            documentation?: string | MarkdownString;
            snippetName?: string;
            additionalEdits?: { span: language.Span; insertText: string }[];
            /**
             * A string that should be used when comparing this item
             * with other items. When `falsy` the [label](#CompletionItem.label)
             * is used.
             */
            sortText?: string;
            commitCharacters?: string[];
            /**
             * Priority for sorting used in addition to sortText.
             */
            highPriority?: boolean;
            preselect?: boolean;
        }) {
    }

    public static fromFunctionMetadata(metadata: IFunctionMetadata, span: language.Span): Item {
        // We want to show the fully-qualified name in the completion's title, but we only need to insert the
        // unqualified name, since the namespace is already there (if any)
        let insertText: string = metadata.unqualifiedName;

        return new Item(
            {
                label: metadata.fullName,
                insertText,
                span,
                kind: CompletionKind.Function,
                detail: `(function) ${metadata.usage}`,
                documentation: metadata.description
            });
    }

    public static fromNamespaceDefinition(namespace: UserFunctionNamespaceDefinition, span: language.Span): Item {
        const label: string = namespace.nameValue.unquotedValue;
        let insertText: string = `${label}.$0`;

        return new Item({
            label,
            insertText,
            span: span,
            kind: CompletionKind.Parameter,
            detail: `(namespace) ${label}`,
            documentation: "User-defined namespace"
        });
    }

    public static fromPropertyName(propertyName: string, span: language.Span): Item {
        return new Item({
            label: propertyName,
            insertText: `${propertyName}$0`,
            span,
            kind: CompletionKind.Property,
            detail: "(property)" // CONSIDER: Add type, default value, etc.
        });
    }

    public static fromParameterDefinition(parameter: IParameterDefinition, span: language.Span, includeRightParenthesisInCompletion: boolean): Item {
        const label: string = `'${parameter.nameValue.unquotedValue}'`;
        return new Item({
            label,
            insertText: `${label}${includeRightParenthesisInCompletion ? ")" : ""}$0`,
            span,
            kind: CompletionKind.Parameter,
            detail: `(parameter)`, // CONSIDER: Add type, default value, etc. from property definition
            documentation: parameter.description
        });
    }

    public static fromVariableDefinition(variable: IVariableDefinition, span: language.Span, includeRightParenthesisInCompletion: boolean): Item {
        const label: string = `'${variable.nameValue.unquotedValue}'`;
        return new Item({
            label,
            insertText: `${label}${includeRightParenthesisInCompletion ? ")" : ""}$0`,
            span,
            kind: CompletionKind.Variable,
            detail: `(variable)`
        });
    }

    /**
     * Dupes the completions list by label, without affecting order
     */
    public static dedupeByLabel(items: Item[]): Item[] {
        const addedLC = new Set<string>();
        const deduped: Item[] = [];

        for (let item of items) {
            const itemLabelLC = item.label.toLowerCase();
            if (!addedLC.has(itemLabelLC)) {
                deduped.push(item);
                addedLC.add(itemLabelLC);
            }
        }

        return deduped;
    }
}

export enum CompletionKind {
    // TLE completions
    Function = "Function",
    Parameter = "Parameter",
    Variable = "Variable",
    Property = "Property",
    Namespace = "Namespace",

    // Template file completions
    DtResourceIdResType = "DtResourceIdResType", // First arg of resourceId
    DtResourceIdResName = "DtResourceIdResName", // Second arg of resourceId

    // Parameter file completions
    DpPropertyValue = "DpPropertyValue", // Parameter from the template file
    DpNewPropertyValue = "DpNewPropertyValue" // New, unnamed parameter
}
