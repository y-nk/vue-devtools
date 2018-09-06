import { stringify } from '../util'

export function initRouterBackend (hook, bridge, rootInstances) {
  let recording = true

  const getSnapshot = () => {
    const routeChanges = []
    rootInstances.forEach(instance => {
      const router = instance._router
      if (router && router.options && router.options.routes) {
        routeChanges.push(...router.options.routes)
      }
    })
    return stringify({
      routeChanges
    })
  }

  bridge.send('routes:init', getSnapshot())

  bridge.on('router:toggle-recording', enabled => {
    recording = enabled
  })

  const Vue = hook.Vue;
  rootInstances.forEach(instance => {
    const router = instance._router

    if (router && !router.__devtools_patch__) {
      router.afterEach((to, from) => {
        if (hook.Vue !== Vue || !recording) return
        bridge.send('router:changed', stringify({
          to,
          from,
          timestamp: Date.now()
        }))
      })
      bridge.send('router:init', stringify({
        mode: router.mode,
        current: {
          from: router.history.current,
          to: router.history.current,
          timestamp: Date.now()
        }
      }))

      if (router.matcher && router.matcher.addRoutes) {
        const addRoutes = router.matcher.addRoutes
        router.matcher.addRoutes = function (routes) {
          routes.forEach((item) => {
            bridge.send('routes:changed', stringify(item))
          })
          addRoutes.call(this, routes)
        }
      }
      router.__devtools_patch__ = true;
    }
  })
}

export function getCustomRouterDetails (router) {
  return {
    _custom: {
      type: 'router',
      display: 'VueRouter',
      value: {
        options: router.options,
        currentRoute: router.currentRoute
      },
      fields: {
        abstract: true
      }
    }
  }
}
