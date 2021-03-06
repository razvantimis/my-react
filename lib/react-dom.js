(() => {
  let rootDOMElement, newRootReactElement, oldRootReactElement;
  function changed(newNode, oldNode) {
    return (
      typeof newNode !== typeof oldNode ||
      ((typeof newNode === "string" || typeof newNode === "number") &&
        newNode !== oldNode) ||
      newNode.type !== oldNode.type ||
      (newNode.type &&
        newNode.type.typeof &&
        newNode.type.typeof === React.types.REACT_CONTEXT_TYPE)
    );
  }
  function findRefNodeProviderType(children) {
    for (const node of children) {
      if (
        node.type &&
        node.type.typeof &&
        node.type.typeof === React.types.REACT_PROVIDER_TYPE
      ) {
        return node;
      } else {
        return node.children && node.children.length
          ? findRefNodeProviderType(node.children)
          : null;
      }
    }
  }
  function updateDom($parent, newNode, oldNode, index = 0) {
    if (newNode.type && newNode.type.isClass && newNode.type.needUpdate) {
      newNode.children = [newNode.type.render()];
      const nodeRef = findRefNodeProviderType(newNode.children);
      if (nodeRef) {
        nodeRef.type._context._currentValue = nodeRef.props.value;
        console.log("rerender", nodeRef);
      }
      newNode.type.needUpdate = false;
    }
    if (isNullOrUndefined(oldNode)) {
      $parent.appendChild(createDOMElement(newNode));
    } else if (isNullOrUndefined(newNode)) {
      $parent.removeChild($parent.childNodes[index]);
    } else if (changed(newNode, oldNode)) {
      $parent.replaceChild(
        createDOMElement(newNode),
        $parent.childNodes[index]
      );
    } else if (newNode.type) {
      const newLength = newNode.children.length;
      const oldLength = oldNode.children.length;
      for (let i = 0; i < newLength || i < oldLength; i++) {
        updateDom(
          $parent.childNodes[index],
          newNode.children[i],
          oldNode.children[i].type
            ? { ...oldNode.children[i] }
            : oldNode.children[i],
          i
        );
      }
    }
  }
  function createDOMElement(node) {
    if (typeof node === "string" || typeof node === "number") {
      return document.createTextNode(node);
    }
    let $el;
    if (node.type.isClass) {
      node.type.componentWillMount && node.type.componentWillMount();
      $el = document.createElement(node.type.constructor.name);
    } else if (isStateLessComponent(node.type)) {
      $el = document.createElement(node.type.name);
    } else if (
      node.type.typeof &&
      node.type.typeof === React.types.REACT_CONTEXT_TYPE
    ) {
      const virtualNode = node.children[0](node.type._currentValue);
      return createDOMElement(virtualNode);
    } else if (
      node.type.typeof &&
      node.type.typeof === React.types.REACT_PROVIDER_TYPE
    ) {
      $el = document.createElement(React.types.REACT_PROVIDER_TYPE);
    } else {
      $el = handleHtmlElement(node.type, node.props, node.children);
    }
    node.children.map(createDOMElement).forEach($el.appendChild.bind($el));
    if (node.type.isClass && node.type.componentDidMount) {
      node.type.componentDidMount();
    }
    return $el;
  }
  function handleHtmlElement(type, props, children) {
    const element = document.createElement(type);
    if (props) {
      Object.keys(props).forEach(propName => {
        if (/^on.*$/.test(propName)) {
          element.addEventListener(
            propName.substring(2).toLowerCase(),
            props[propName]
          );
        } else {
          element.setAttribute(propName, props[propName]);
        }
      });
    }
    return element;
  }

  window.ReactDOM = {
    render: (rootReactEl, domEl) => {
      newRootReactElement = rootReactEl;
      oldRootReactElement = { ...newRootReactElement };
      rootDOMElement = domEl;
      console.log(newRootReactElement);
      updateDom(domEl, newRootReactElement);
    },
    reRender: () => {
      console.log(newRootReactElement);
      updateDom(rootDOMElement, newRootReactElement, oldRootReactElement);
      oldRootReactElement = newRootReactElement;
    }
  };
})();
