# App Gateway -> API Management -> App Service Environment

This repo and these docs are a WIP.

## Quick Start

- Clone the repo
- `npm install`
- Modify the config to suit your needs
- `npm run setup` (takes ~5 minutes)
- `npm run deploy` (takes ~1 hour)
  - I know I said "quick" start, but ASEs take a long time to spin up!
- Perform the post-deployment steps
- Deploy to your apps

## Configuration


## Deployment

### Phase 1: Setup

- Manual step: Configure Key Vault access for your team. They'll need at least Certificates Read permissions to deploy updates to this infrastructure.

### Phase 2: Deploy

## Post-Deployment Setup

### Configuring SSL for your App Service Environment

After your infrastructure deployment is complete, you'll need to add an SSL certificate to your ASE. Unfortunately, there currently isn't a way to do this programmatically, so we'll do it through the portal.

1. Navigate to your ASE in the portal
2. Click on "ILB Certificate"
3. Click "Update ILB Certificate"
4. Download your ASE certificate from Azure Key Vault. The following script will download the certificate and password protect it (after prompting you for a password)
  ```
  aseCertSecretName='your cert secret name'
  keyVaultName='your key vault name'
  az keyvault secret show --name "$aseCertSecretName" --vault-name "$keyVaultName" --query value --output tsv | base64 --decode | openssl pkcs12 -nodes -passin pass: | openssl pkcs12 -export -out "$aseCertSecretName.pfx"`
  ```
5. The script will output a pfx file to your current directory. Back in the Azure portal, select this file from the file input and enter the password you used to protect the certificate.
6. Click "Upload"

### Configuring DNS

In order for APIM to make calls to the backend ASE, we need to configure private DNS for the VNet.

**NOTE:** This is not a production-ready DNS solution. Making it production-ready would involve automated deployments and configuration management, redundancy (i.e. VM Scale Sets), monitoring, etc.

- In the Azure portal, create a new Windows Server 2016 VM in the "networking" resource group created as part of this deployment
- Place the VM in the "default" subnet of the vnet created as part of this deployment
- Configure your VM's NIC to use a static IP. Take note of the IP.
- RDP into your VM and add the DNS Server role (Server Manager -> Add Roles -> DNS Server)
- Server Manager -> DNS -> Right click on your server -> DNS Manager -> right click forward lookup zones -> new zone
  - Specify `ase.[your domain]` as the zone name
- Right click the newly created zone -> new host -> Enter "*" as the name and your ASE's ILB IP address
- Right click the newly created zone -> new host -> Enter "*.scm" as the name and your ASE's ILB IP address
- In your configuration file in this repo, enter the IP address of your DNS server under `networking.dnsServers`, and run `npm run deploy` to deploy the change
- Navigate to your VNet in the portal -> DNS Servers -> Custom -> Enter your DNS Server's static IP
- Navigate to your APIM instance in the portal -> Virtual network -> Apply network configuration

### Adding a new App Service

From the portal...

- Create an App Service Plan on the new ASE
- Create an App Service on the new App Service Plan

#### Allowing SCM access to the new App Service

In the APIM Template...

- Add httplistener
- Add request routing rule
- Use ase backend & http settings

#### Allowing APIM to accept self-signed certificates from backends

If you are using self-signed certificates on your ASE (default), you'll need to disable certificate chain validation on your APIM service. The following PowerShell commands will configure this for you.

```
$apimRg = "Your resource group"
$apimName = "The name of your APIM service"
$aseUrl = "https://[your app service].[your ASE domain]"
$aseScmUrl = "https://[your app service].scm.[your ASE domain]"

$context = New-AzureRmApiManagementContext -resourcegroup $appRg -servicename $apimName
New-AzureRmApiManagementBackend -Context  $context -Url $aseUrl -Protocol http -SkipCertificateChainValidation $true
New-AzureRmApiManagementBackend -Context  $context -Url $aseScmUrl -Protocol http -SkipCertificateChainValidation $true
```

## Teardown

`npm run teardown`

Deletes all resource groups creates as part of this deployment.

## Dev Access

### App Service Kudu Access
TODO

### APIM Git Repo Access
TODO

### Deploying to App Service
TODO
