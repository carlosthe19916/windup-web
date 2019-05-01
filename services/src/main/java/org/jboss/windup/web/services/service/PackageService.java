package org.jboss.windup.web.services.service;

import java.util.Collection;
import java.util.Map;
import java.util.TreeMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.transaction.Transactional;
import javax.ws.rs.NotFoundException;

import org.jboss.forge.furnace.Furnace;
import org.jboss.windup.util.exception.WindupException;
import org.jboss.windup.web.addons.websupport.services.PackageDiscoveryService;
import org.jboss.windup.web.furnaceserviceprovider.FromFurnace;
import org.jboss.windup.web.furnaceserviceprovider.WebProperties;
import org.jboss.windup.web.services.model.Package;
import org.jboss.windup.web.services.model.PackageMetadata;
import org.jboss.windup.web.services.model.RegisteredApplication;

/**
 * Service for manipulation with packages
 *
 * @author <a href="mailto:dklingenberg@gmail.com">David Klingenberg</a>
 */
public class PackageService
{
    private static java.util.logging.Logger LOG = java.util.logging.Logger.getLogger(PackageService.class.getSimpleName());

    @PersistenceContext
    EntityManager entityManager;

    @Inject
    private Furnace furnace;

    @Inject
    @FromFurnace
    PackageDiscoveryService packageDiscoveryService;

    WebProperties webProperties;

    @PostConstruct
    protected void init()
    {
        this.webProperties = WebProperties.getInstance();
    }

    /**
     * Discovers packages in application
     *
     * @param application Application to discover packages in
     * @return Collection of discovered packages
     */
    @Transactional
    public Collection<Package> discoverPackages(RegisteredApplication application)
    {
        Long applicationId = application.getId();
        // Reload it to insure that any lazy loaded fields are still available.
        // Don't reload if the id is null (can happen in tests or with detached instances)
        if (applicationId != null)
            application = this.entityManager.find(RegisteredApplication.class, applicationId);

        if (application == null)
            throw new NotFoundException("Non-existent app ID: " + applicationId);

        PackageMetadata appPackageMetadata = application.getPackageMetadata();
        appPackageMetadata.setScanStatus(PackageMetadata.ScanStatus.IN_PROGRESS);
        this.entityManager.merge(appPackageMetadata);

        String rulesPath = this.webProperties.getRulesRepository().toString();
        String inputPath = application.getInputPath();

        LOG.info("Starting package discovery");

        PackageDiscoveryService.PackageDiscoveryResult result = this.packageDiscoveryService.execute(rulesPath, inputPath);

        LOG.info("Package discovery finished");

        Map<String, Package> appPackageMap = new TreeMap<>();
        appPackageMetadata.getPackages().forEach(aPackage -> appPackageMap.put(aPackage.getFullName(), aPackage));

        // TODO: Remove deleted packages
        this.addPackagesToPackageMetadata(appPackageMetadata, result.getKnownPackages(), appPackageMap, true);
        this.addPackagesToPackageMetadata(appPackageMetadata, result.getUnknownPackages(), appPackageMap, false);

        appPackageMetadata.setScanStatus(PackageMetadata.ScanStatus.COMPLETE);
        this.entityManager.merge(appPackageMetadata);

        LOG.info("Updated application (id: " + applicationId + ", name: " + application.getTitle() +  ")");

        return appPackageMetadata.getPackages();
    }

    private void addPackagesToPackageMetadata(PackageMetadata metadata, Map<String, Integer> discoveredPackages, Map<String, Package> packageMap, boolean isKnown)
    {
        for (String packageName : discoveredPackages.keySet())
        {
            Package aPackage = this.createPackageHierarchy(packageName, discoveredPackages, packageMap, isKnown);
            metadata.addPackage(aPackage);
        }
    }

    /**
     * Creates package class for whole package hierarchy (including all parents) and returns last child Example: org.jboss.windup will create root
     * org, child jboss, child windup and return windup
     *
     *
     * @param fullPackageName Fully qualified package name
     * @param packageClassCount Map with package name as key and class count as value
     * @param packageMap Map with package name as key and package class as value
     * @return Package
     */
    Package createPackageHierarchy(String fullPackageName, Map<String, Integer> packageClassCount, Map<String, Package> packageMap, boolean isKnown)
    {
        Package parent = null;

        StringBuilder currentPackageName = new StringBuilder();

        String[] nameParts = fullPackageName.split("\\.");

        for (String singlePartName : nameParts)
        {
            currentPackageName.append(singlePartName);
            String currentPackageNameString = currentPackageName.toString();

            if (!packageMap.containsKey(currentPackageNameString))
            {
                Package pkage = new Package(singlePartName, currentPackageNameString, isKnown);

                if (packageClassCount.containsKey(currentPackageNameString))
                {
                    pkage.setCountClasses(packageClassCount.get(currentPackageNameString));
                }
                else
                {
                    pkage.setCountClasses(0);
                }

                pkage.setParent(parent);
                this.entityManager.persist(pkage);

                if (parent != null)
                {
                    parent.addChild(pkage);
                    this.entityManager.merge(parent);
                }

                packageMap.put(currentPackageNameString, pkage);

                parent = pkage;
            }
            else
            {
                parent = packageMap.get(currentPackageNameString);
            }

            currentPackageName.append(".");
        }

        return parent;
    }
}
