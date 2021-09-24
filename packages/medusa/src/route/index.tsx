import React from 'react';
import {PluginNextRoute} from '../plugins/next';
import {PluginPeerRoute} from '../plugins/peer';
import {PluginIceStarkRoute} from '../plugins/ali';
import {PluginCommonRoute} from '../plugins/common';
import {PluginZoeRoute} from '../plugins/jd-micro';

export type IRouteProps = {
  path: string
  exact?: boolean

  /**
   * 指定子应用采用的微前端类型，针对不同类型的框架，medusa会做不同的处理
   *
   * icestark：飞冰框架
   *
   * qiankun： 乾坤框架
   *
   * zoe：京东微前端框架
   *
   * next：'next框架'

   */
  framework?: 'icestark' | 'qiankun' | 'zoe' | 'next' | 'ty-next'

  assets?: {
    js?: Array<string>
    css?: Array<string>
  }

  /**
   * 用于区分每个路由的id, next模式下推荐使用
   */
  appId?:string

  /**
   * 用于指定动态添加的DOM ID。不填则由框架自动生成，如果填了，请保证子应用的加载id和填写的一致
   */
  rootId?: string

  /**
   * 清单文件，一般由webpack生成, 如[a.[chunk].js, b.[chunk].js, a.[chunk].css]或者{"a.js":"a.[chunk].js", "a.css":"a.[chunk].css"}格式的文件,加载的时候会根据后缀名按序加载，【推荐三颗星】
   */
  manifest?: string

  /**
   * 乾坤的加载方式，开发和线上都可以用，比较省事，【推荐三颗星】
   */
  html?:string

  credentials?: boolean

  /**
   * 透传给子应用的basename, 支持正则表达式，参数为path中的参数, 不填则默认取path的最后一个/之前的字串
   */
  basename?: string

  /**
   * 是否只使用路由功能，放弃微前端加载？
   */
  peer?: boolean

  /**
   * 有些情况子项目的变量确实需要注册到主window？
   */
  globalVars?: Array<string>

  /** 是否自动执行 container._reactRootContainer.unmount() */
  autoUnmount?: boolean

  /**
   * 默认3
   */
  tyNextVersion?: 1 | 3

  /**
   * 是否将style插入到容器里
   */
  scopeCss?: boolean
}

const Route:React.FC<IRouteProps> = (props) => {
  if (props.peer) {
    return <PluginPeerRoute {...props}>{props.children}</PluginPeerRoute>;
  }

  if (props.framework === 'next' || props.framework === 'ty-next') {
    return <PluginNextRoute {...props} />;
  }

  if (props.framework === 'icestark' || props.framework === 'qiankun') {
    return <PluginIceStarkRoute {...props} />;
  }

  if (props.framework === 'zoe') {
    return <PluginZoeRoute {...props} />;
  }

  return <PluginCommonRoute {...props} />;
};


export default Route;
