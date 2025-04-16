import * as Mdast from 'mdast';
import { MdastImportVisitor, $createImageNode, ImageNode, CreateImageNodeParameters } from '@mdxeditor/editor';
import {
  RangeSelection,
  LexicalEditor,
  createEditor,
  LexicalNode,
  ElementNode,
  DecoratorNode,
  RootNode,
  ParagraphNode,
  TextNode,
  $isTextNode,
  $isParagraphNode,
  $isRangeSelection,
  $isNodeSelection,
  $getRoot,
  $copyNode,
  $createParagraphNode,
  $createTextNode,
  KlassConstructor,
  $setSelection,
  $getSelection,
  $getPreviousSelection,
  $createPoint,
  $createRangeSelection,
  $createNodeSelection,
  $isElementNode,
  $isDecoratorNode,
  SerializedEditor,
  NodeSelection,
  NodeKey,
  $insertNodes,
} from "lexical";

import { ReactNode } from "react";

export const MdastImageVisitor: MdastImportVisitor<Mdast.Image> = {
  testNode: 'image',
  priority: 100,
  visitNode({ mdastNode, actions }) {
    const evoyaImageNode = $createEvoyaImageNode();
    const imageNode = $createImageNode({
      src: mdastNode.url,
      altText: mdastNode.alt ?? '',
      title: mdastNode.title ?? ''
    });

    evoyaImageNode.append(imageNode);

    actions.addAndStepInto(
      imageNode
    )
  }
}

// export class EvoyaImageNode extends DecoratorNode<ReactNode> {
export class EvoyaImageNode extends ImageNode {
  static getType(): string {
    return 'evoyaimage';
  }

  // static clone(node: EvoyaImageNode): EvoyaImageNode {
  //   return new EvoyaImageNode(node.__key);
  // }

  static clone(node: EvoyaImageNode): EvoyaImageNode {
    return new EvoyaImageNode(node.__src, node.__altText, node.__title, node.__width, node.__height, node.__rest, node.__key)
  }

  // constructor(key?: NodeKey) {
  //   super(key);
  // }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  // decorate(): ReactNode {
  //   return <div className="evoyaImage"></div>;
  // }

  decorate(_parentEditor: LexicalEditor): JSX.Element {
    return (<div className="testtt">
      {super.decorate(_parentEditor)}
    </div>);
    
    // return (
    //   <ImageEditor
    //     src={this.getSrc()}
    //     title={this.getTitle()}
    //     nodeKey={this.getKey()}
    //     width={this.__width}
    //     height={this.__height}
    //     alt={this.__altText}
    //     rest={this.__rest}
    //   />
    // )
  }
}

export function $createEvoyaImageNode(params: CreateImageNodeParameters): ImageNode {
  const { altText, title, src, key, width, height, rest } = params
  return new ImageNode(src, altText, title, width, height, rest, key)
}

/**
 * Retruns true if the node is an {@link ImageNode}.
 * @group Image
 */
export function $isEvoyaImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof EvoyaImageNode
}

// export function $createEvoyaImageNode(id: string): EvoyaImageNode {
//   return new EvoyaImageNode(id);
// }

// export function $isEvoyaImageNode(
//   node: LexicalNode | null | undefined,
// ): node is EvoyaImageNode {
//   return node instanceof EvoyaImageNode;
// }