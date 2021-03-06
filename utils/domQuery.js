import JsonTree from './jsonTree';

/**
 * 选择转换器 #: id  .： class  @: attr
 * selector String
 * return Array 
 */
let selectorParser = (selector) => {
  let selectors = selector && selector.split(/\s+/);
  const reg = /(#|\.|@)/g;
  selectors = selectors.map((selector, index) => {
    let sls = selector.replace(reg, ',$1').split(',');
    sls = !!sls[0] ? sls : sls.slice(1);
    return sls.map(sl => {
      let type = '';
      let name = '';
      switch (sl[0]) {
        case '#':
          type = 'id';
          name = sl.slice(1);
          break;
        case '.':
          type = 'class';
          name = sl.slice(1);
          break;
        case '@':
          type = 'attr';
          name = sl.slice(1);
          break;  
        default:
          type = 'tag';
          name = sl.slice(0);
          break;
      }
      return {
        type,
        name
      };
    });
  });
  return selectors;
}

/**
 * 根据单个选择器获取dom
 * selector Object
 * tree Object
 * return Array
 */
let getDomBySingleSelector = (selector, tree) => {
  let doms = [];
  switch(selector.type) {
    case 'id':
      doms = tree.getNodesById(selector.name);
      break;
    case 'class':
      doms = tree.getNodesByClassName(selector.name);
      break;
    case 'attr':
      const obj = selector.name.split(':');
      const key = obj[0];
      const val = obj[1];
      doms = tree.getNodesByAtrr(key, val);
      break;
    default:
      doms = tree.getNodesByTagName(selector.name);
      break;    
  }
  return doms;
}

/**
 * 连续选择器获取dom
 * selectors Array
 * tree Object
 * return Array
 */
let getDomByLinkSelector = (selectors, tree) => {
  if (selectors.length < 1) return tree;
  let tempDoms = getDomBySingleSelector(selectors[0], tree);
  tempDoms = tempDoms.filter(dom => {
    return selectors.every(sls => {
      if (sls.type === 'id') {
        return sls.name === dom.attr.id;
      } else if (sls.type === 'class') {
        const domClasses = dom.attr.class;
        return domClasses ? domClasses.indexOf(sls.name) >= 0 : false;
      } else if (sls.type === 'attr') {
        const obj = sls.name.split(':');
        const key = obj[0];
        const val = obj[1];
        return dom.attr[key] === val;
      } else {
        return dom.tag === sls.name
      }
    });
  });
  return tempDoms;
}

/**
 * 连续选择器队列
 */
let getDomByQueueSelector = (selectorQueue, tree) => {
  let doms = [];
  let innerGetDom = (selectorQueue, tree) => {
    if (selectorQueue.length === 1) {
      doms = doms.concat(getDomByLinkSelector(selectorQueue[0], tree));
    } else {
      const nextDoms = getDomByLinkSelector(selectorQueue[0], tree);
      nextDoms.forEach(dom => {
        innerGetDom(selectorQueue.slice(1), new JsonTree(dom, true));
      });
    }
  }
  innerGetDom(selectorQueue, tree);
  return  doms;
}

/**
 * domQuery函数
 */
let getNodesBySelectorFn = (tree) => {
  return (selector) => {
    const isObject = Object.prototype.toString.call(selector) === '[object Object]';
    // 判断参数是否是 object
    if (isObject) {
      return new JsonTree(selector, true);
    } else {
      const selectors = selectorParser(selector);
      const doms = getDomByQueueSelector(selectors, tree);
      return doms.map(dom => new JsonTree(dom, true));
    }
  }
}

/**
 * 入口函数
 */
let domQuery = (htmlStr) => {
    const isObject = Object.prototype.toString.call(htmlStr) === '[object Object]';
    let tree = new JsonTree(htmlStr, isObject);
    return getNodesBySelectorFn(tree);
}

export default domQuery;