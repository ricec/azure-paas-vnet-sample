# Motivation for Handlebars Build Step

This repo makes use of Handlebars as an extra step in the build process to inject configuration into ARM templates. This may not make sense to some, given ARM's support for parameters, outputs, external parameter files, etc. However, I have my reasons, which I've described below.

In ARM template deployments, sharing information between templates typically results in a complicated, repetitive mess of parameters passed into templates and outputs passed back. Because ARM templates lack the concept of global configuration, you end up passing information around via parameters and outputs. The alternative is defining all of your resources in a single template file so they can all easily reference each other and the same set of configuration, but this is at the cost of modularity and ease of understanding. Both of these options can work fine for small deployments, but when you're dealing with several resources all referencing each other, each with several configuration items, it becomes a little hairy. You end up with a lot of repetition, and the data flow becomes hard to wrap your head around.

As an example, think about the situation where you're deploying multiple services, app gateways, VMs, etc. within a single virtual network. These resources will all need a reference to the virtual network in order for them to be created within the virtual network. Supplying this reference would typically be done via parameters and outputs as shown below:

vnet.json:
```json
{
  "parameters": {
    "vnetName": {
      "type": "string"
    },
    "subnetName": {
      "type": "string"
    }
  },
  ...
  "outputs": {
    "vnetId": {
      "type": "string",
      "value": "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]"
    },
    "subnetName": {
      "type": "string",
      "value": "[parameters('subnetName')]"
    }
  }
  ...
}
```

app-gateway.json:
```json
{
  ...
  "parameters": {
    "vnetId": {
      "type": "string"
    },
    "subnetId": {
      "type": "string"
    }
  },
  ...
}
```

main.json:
```json
{
  ...
  "resources": [
    {
      "name": "vnet-deployment",
      "type": "Microsoft.Resources/deployments",
      "templateLink": {
        "uri": "https://.../vnet.json"
      },
      ...
    },
    {
      "name": "app-gateway-deployment",
      "type": "Microsoft.Resources/deployments",
      "templateLink": {
        "uri": "https://.../app-gateway.json"
      },
      "parameters": {
        "vnetId": {
          "value": "[reference('vnet-deployment').outputs.vnetId.value]"
        },
        "subnetName": {
          "value": "[reference('vnet-deployment').outputs.subnetName.value]"
        },
        ...
      }
      ...
    },
    ...
  ],
  ...
}
```

So you have a main template file that triggers deployments for the nested template files and is responsible for passing the outputs of one deployment as inputs of another. There's nothing too wild going on here, but when you are talking about 10 resources, each having 10 outputs, you can see how this might get out of hand. In the coding world, the typical solution to this problem of too many inputs and too many outputs is to create objects to encapsulate them. This can be done in ARM via "object" parameters! Here's an example of what this option might look like:


vnet.json:
```json
{
  "parameters": {
    "vnetConfig": {
      "type": "object"
    }
  },
  ...
}
```

app-gateway.json:
```json
{
  ...
  "parameters": {
    "vnetConfig": {
      "type": "object"
    }
  },
  ...
}
```

main.json:
```json
{
  ...
  "resources": [
    {
      "name": "vnet-deployment",
      "type": "Microsoft.Resources/deployments",
      "templateLink": {
        "uri": "https://.../vnet.json"
      },
      "vnetConfig": {
        "value": "[variables('vnetConfig')]"
      },
      ...
    },
    {
      "name": "app-gateway-deployment",
      "type": "Microsoft.Resources/deployments",
      "templateLink": {
        "uri": "https://.../app-gateway.json"
      },
      "parameters": {
        "vnetConfig": {
          "value": "[variables('vnetConfig')]"
        },
        ...
      }
      ...
    },
    ...
  ],
  ...
}
```

This is great! We've reduced the number of parameters we need to keep track of, and things are a little more readable. It comes at a cost, though. When you start passing around objects as parameters, you lose out on one of the nice aspects of ARM: parameter type checking. It's not the end of the world, but wouldn't it be nice if you could have clean, understandable configuration AND keep the niceties of ARM?

This is the motivation behind this repo's build process. Configuration lives outside of the ARM templates, and it gets injected into them via a Handlebars template compilation process. This is how your templates might look using this approach:

vnet.json:
```json
{
  "parameters": {
    "vnetName": {
      "type": "string",
      "defaultValue": "{{networking.vnetName}}"
    }
  },
  ...
}
```

app-gateway.json:
```json
{
  ...
  "parameters": {
    "vnetName": {
      "type": "string",
      "defaultValue": "{{networking.vnetName}}"
    }
  },
  ...
}
```

main.json:
```json
{
  ...
  "resources": [
    {
      "name": "vnet-deployment",
      "type": "Microsoft.Resources/deployments",
      "templateLink": {
        "uri": "https://.../vnet.json"
      }
      ...
    },
    {
      "name": "app-gateway-deployment",
      "type": "Microsoft.Resources/deployments",
      "templateLink": {
        "uri": "https://.../app-gateway.json"
      },
      ...
    },
    ...
  ],
  ...
}
```

Benefits of this approach:

- Infrastructure configuration is separate from the templates themselves and can be used by both ARM and non-ARM processes
- Referencing the configuration item directly from the template makes it immediately apparent where a value is coming from. No need to trace inputs and outputs to figure it out.
- The ARM templates are still valid and can be used without the build process as long as you supply all of the necessary parameters

There's no argument that this approach has some downsides (e.g. adding another templating language and step to the infrastructure automation process) and that there are other reasonable approaches out there. This approach is just the one that maximizes the aspects of ARM that I like and minimizes the ones that I don't.
