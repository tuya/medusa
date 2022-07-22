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
   *
   */
  framework?: 'icestark' | 'qiankun' | 'zoe' | 'next' | 'ty-next'

  /**
   * 飞冰的加载方式，推荐只开发的时候用，因为线上静态文件的文件名一般会变，【推荐两颗星】
   */
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
   * 是否将style插入到容器里，默认为id选择器（qiankun框架下默认为property）, 设置property为属性选择器
   */
  scopeCss?: boolean | 'property' | 'id'

  onUrlFix?: (url: string) => string | undefined

  /**
   * 用于prefetch的时候，指定的预加载路径
   */
  prefetchUrl?: string

  /**
   * 初始加载的时候，传递给子应用的数据，目前只有qiankun有效
   */
  props?: Record<string, any>

  /**
   * 指定部分特殊的动态加载的微应用资源（css/js) 不被 qiankun 劫持处理, 目前只对qiankun生效，后续看效果加上
   */
  excludeAssetFilter?: (assetUrl: string) => boolean

  /**
   * 初始注入一些全局变量至沙箱
   */
  injectGlobals?: Record<string, any>

  /**
   * 初始挂载到容器节点的html片段，由子应用自己代码里清除或保留
   */
  initHtmlStr?: string

  /**
   * 获取的子应用html，可进行替换
   */
  getTemplate?: (tpl: string) => string
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
