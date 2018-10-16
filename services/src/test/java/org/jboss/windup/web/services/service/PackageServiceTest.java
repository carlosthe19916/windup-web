package org.jboss.windup.web.services.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.file.Path;
import java.util.*;

import javax.persistence.EntityManager;

import org.jboss.windup.web.addons.websupport.services.PackageDiscoveryService;
import org.jboss.windup.web.furnaceserviceprovider.WebProperties;
import org.jboss.windup.web.services.data.DataProvider;
import org.jboss.windup.web.services.model.Package;
import org.jboss.windup.web.services.model.PackageMetadata;
import org.jboss.windup.web.services.model.RegisteredApplication;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

/**
 * @author <a href="mailto:dklingenberg@gmail.com">David Klingenberg</a>
 */
public class PackageServiceTest
{
    protected PackageService packageService;
    protected String sampleAppPath;

    private static class PackageMetadataMock extends PackageMetadata
    {
        List<ScanStatus> scanStatusList = new ArrayList<>();

        @Override
        public void setScanStatus(ScanStatus scanStatus)
        {
            super.setScanStatus(scanStatus);
            this.scanStatusList.add(scanStatus);
        }
    }

    @Before
    public void setUp()
    {
        this.sampleAppPath = this.getClass().getResource(DataProvider.TINY_SAMPLE_PATH).toString();
        this.packageService = new PackageService();
        this.packageService.entityManager = mock(EntityManager.class);
        this.packageService.packageDiscoveryService = mock(PackageDiscoveryService.class);
        this.packageService.webProperties = mock(WebProperties.class);

        Path pathMock = mock(Path.class);
        when(this.packageService.webProperties.getRulesRepository()).thenReturn(pathMock);
        when(pathMock.toString()).thenReturn(null);

        when(this.packageService.packageDiscoveryService.execute(null, this.sampleAppPath))
                    .thenReturn(
                                new PackageDiscoveryService.PackageDiscoveryResult(
                                            this.getKnownPackagesMap(),
                                            this.getUnknownPackagesMap()));
    }

    protected Map<String, Integer> getUnknownPackagesMap()
    {
        Map<String, Integer> packageClassCnt = new TreeMap<>();
        packageClassCnt.put("org", 0);
        packageClassCnt.put("org.jboss", 50);
        packageClassCnt.put("org.jboss.windup", 100);
        packageClassCnt.put("org.jboss.windup.web", 10);

        return packageClassCnt;
    }

    protected Map<String, Integer> getKnownPackagesMap()
    {
        Map<String, Integer> packageClassCnt = new TreeMap<>();
        packageClassCnt.put("com", 0);
        packageClassCnt.put("com.apache", 10);
        packageClassCnt.put("com.apache.tomcat", 12);

        return packageClassCnt;
    }

    /**
     * This test tests creating package hierarchy from string. It tests if all parents of package are correctly created.
     */
    @Test
    public void testCreatePackageHierarchy()
    {
        PackageService service = new PackageService();
        service.entityManager = mock(EntityManager.class);

        Map<String, Integer> packageClassCnt = this.getUnknownPackagesMap();

        Map<String, Package> packageMap = new TreeMap<>();

        Package aPackage = service.createPackageHierarchy("org.jboss.windup.web", packageClassCnt, packageMap, false);

        Assert.assertEquals(4, packageMap.keySet().size());

        Assert.assertEquals("org.jboss.windup.web", aPackage.getFullName());
        Assert.assertEquals("web", aPackage.getName());
        Assert.assertEquals(10, aPackage.getCountClasses());

        Package parent = aPackage.getParent();
        Assert.assertEquals("org.jboss.windup", parent.getFullName());
        Assert.assertEquals("windup", parent.getName());
        Assert.assertEquals(100, parent.getCountClasses());

        Package grandParent = parent.getParent();
        Assert.assertEquals("org.jboss", grandParent.getFullName());
        Assert.assertEquals("jboss", grandParent.getName());
        Assert.assertEquals(50, grandParent.getCountClasses());

        Package root = grandParent.getParent();
        Assert.assertEquals("org", root.getFullName());
        Assert.assertEquals("org", root.getName());
        Assert.assertEquals(0, root.getCountClasses());

        Assert.assertNull(root.getParent());
    }

    /**
     * Tests package discovery for application group with single app. Tests results and status changes.
     */
    @Test
    public void testDiscoverPackagesSingleApp()
    {
        PackageMetadataMock appMetadataMock = new PackageMetadataMock();
        RegisteredApplication application = this.getApplication(appMetadataMock);

        Assert.assertEquals(PackageMetadata.ScanStatus.QUEUED, appMetadataMock.getScanStatus());

        Collection<Package> discoveredPackages = this.packageService.discoverPackages(application);

        Assert.assertEquals(7, discoveredPackages.size());

        // Track changes of status - first it should be set to IN_PROGRESS and then to COMPLETE
        Assert.assertEquals(PackageMetadata.ScanStatus.IN_PROGRESS, appMetadataMock.scanStatusList.get(0));
        Assert.assertEquals(PackageMetadata.ScanStatus.COMPLETE, appMetadataMock.scanStatusList.get(1));
        Assert.assertEquals(PackageMetadata.ScanStatus.COMPLETE, appMetadataMock.getScanStatus());
    }

    protected RegisteredApplication getApplication(PackageMetadata packageMetadata)
    {
        RegisteredApplication application = new RegisteredApplication(this.sampleAppPath);
        application.setPackageMetadata(packageMetadata);

        return application;
    }
}
