package org.jboss.windup.web.services.rest;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import java.util.List;
import java.util.Map;

/**
 * @author <a href="mailto:jesse.sightler@gmail.com">Jesse Sightler</a>
 */
@Path("/graph")
@Consumes("application/json")
@Produces("application/json")
public interface GraphResource
{
    String GLOBAL_GRAPH = "global";
    String KEY_ID = "_id";

    @GET
    @Path("/{executionID}/{id}")
    Map<String, Object> get(@PathParam("executionID") Long executionID, @PathParam("id") Integer id, @QueryParam("depth") Integer depth);

    @GET()
    @Path("/{executionID}/by-type/{vertexType}")
    List<Map<String, Object>> getByType(@PathParam("executionID") Long executionID, @PathParam("vertexType") String vertexType, @QueryParam("depth") Integer depth);

    @POST
    @Path("/{executionID}")
    Map<String, Object> create(@PathParam("executionID") Long executionID, Map<String, Object> value);

    @PUT
    @Path("/{executionID}/{id}")
    Map<String, Object> update(@PathParam("executionID") Long executionID, @PathParam("id") Integer id, Map<String, Object> value);

    @DELETE
    @Path("/{executionID}/{id}")
    void delete(@PathParam("executionID") Long executionID, @PathParam("id") Integer id);
}
